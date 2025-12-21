import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { PointPackage } from "./entities/point-package.entity";
import { CreatePointPackageDto } from "./dto/create-point-package.dto";
import { UpdatePointPackageDto } from "./dto/update-point-package.dto";
import { Tier } from "../tier/entities/tier.entity";
import { PaginationResult } from "../../common/interfaces/pagination-result.interface";

import {
  BusinessPointPackage,
  BusinessPointPackageStatus,
} from "./entities/business-point-package.entity";
import { PaymentService } from "../payment/payment.service";
import { PackageType } from "../payment/dto/package-purchase.dto";
import { BadRequestException } from "@nestjs/common";

@Injectable()
export class PointPackageService {
  constructor(
    @InjectRepository(PointPackage)
    private readonly pointPackageRepository: Repository<PointPackage>,
    @InjectRepository(BusinessPointPackage)
    private readonly businessPointPackageRepository: Repository<BusinessPointPackage>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    private readonly paymentService: PaymentService,
  ) {}

  async create(
    createPointPackageDto: CreatePointPackageDto,
  ): Promise<PointPackage> {
    const { tier_ids, ...rest } = createPointPackageDto;

    const tiers = await this.tierRepository.findBy({ id: In(tier_ids) });
    if (tiers.length !== tier_ids.length) {
      throw new NotFoundException("One or more tiers not found");
    }

    const pointPackage = this.pointPackageRepository.create({
      ...rest,
      tiers,
    });

    return this.pointPackageRepository.save(pointPackage);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginationResult<PointPackage>> {
    const [data, total] = await this.pointPackageRepository.findAndCount({
      relations: ["tiers"],
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findOne(id: string): Promise<PointPackage> {
    const pointPackage = await this.pointPackageRepository.findOne({
      where: { id },
      relations: ["tiers"],
    });

    if (!pointPackage) {
      throw new NotFoundException("Point package not found");
    }

    return pointPackage;
  }

  async update(
    id: string,
    updatePointPackageDto: UpdatePointPackageDto,
  ): Promise<PointPackage> {
    const pointPackage = await this.findOne(id);
    const { tier_ids, ...rest } = updatePointPackageDto;

    if (tier_ids) {
      const tiers = await this.tierRepository.findBy({ id: In(tier_ids) });
      if (tiers.length !== tier_ids.length) {
        throw new NotFoundException("One or more tiers not found");
      }
      pointPackage.tiers = tiers;
    }

    Object.assign(pointPackage, rest);
    return this.pointPackageRepository.save(pointPackage);
  }

  async remove(id: string): Promise<void> {
    const result = await this.pointPackageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Point package not found");
    }
  }

  async getAvailablePackages(
    tierId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<PointPackage>> {
    const [data, total] = await this.pointPackageRepository
      .createQueryBuilder("package")
      .innerJoin("package.tiers", "tier")
      .where("tier.id = :tierId", { tierId })
      .andWhere("package.is_active = :isActive", { isActive: true })
      .orderBy("package.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async buyPackage(businessId: string, packageId: string, provider: string) {
    const pointPackage = await this.findOne(packageId);
    if (!pointPackage.is_active) {
      throw new NotFoundException("Package is not active");
    }

    return this.paymentService.initiatePackagePurchase(
      { id: businessId },
      packageId,
      pointPackage.price,
      provider,
      PackageType.POINT,
      pointPackage.name,
    );
  }

  async confirmPurchase(
    businessId: string,
    transactionId: string,
    provider: string,
  ) {
    const verification = await this.paymentService.verifyPackagePurchase(
      { id: businessId },
      transactionId,
      provider,
    );

    const pointPackage = await this.findOne(verification.packageId);

    const businessPointPackage = this.businessPointPackageRepository.create({
      business: { id: businessId },
      package: pointPackage,
      name: pointPackage.name,
      initial_points: pointPackage.points,
      remaining_points: pointPackage.points,
      transaction_id: verification.transactionId,
    });

    await this.businessPointPackageRepository.save(businessPointPackage);

    return {
      success: true,
      package: businessPointPackage,
    };
  }

  async getMyPackages(businessId: string) {
    return this.businessPointPackageRepository.find({
      where: { business: { id: businessId } },
      order: { created_at: "DESC" },
    });
  }

  async deductPoints(businessId: string, points: number, manager: any) {
    // Find active packages with remaining points, ordered by creation (FIFO)
    const packages = await manager.find(BusinessPointPackage, {
      where: {
        business: { id: businessId },
        status: "ACTIVE", // Assuming 'ACTIVE' is the status for usable packages
        // We also need to check remaining_points > 0, but TypeORM find options for > 0 might need MoreThan
        // Let's filter in code or use query builder if needed.
        // For simplicity, let's fetch all active and filter.
      },
      order: { created_at: "ASC" },
    });

    let pointsToDeduct = points;

    for (const pkg of packages) {
      if (pointsToDeduct <= 0) break;

      if (pkg.remaining_points > 0) {
        const deduction = Math.min(pkg.remaining_points, pointsToDeduct);
        pkg.remaining_points -= deduction;
        pointsToDeduct -= deduction;

        if (pkg.remaining_points === 0) {
          pkg.status = "DEPLETED"; // Update status if depleted
        }

        await manager.save(BusinessPointPackage, pkg);
      }
    }

    if (pointsToDeduct > 0) {
      throw new BadRequestException(
        `Insufficient points. You need ${pointsToDeduct} more points from packages.`,
      );
    }
  }
  async findByTier(tierId: string): Promise<PointPackage[]> {
    return this.pointPackageRepository.find({
      where: {
        tiers: { id: tierId },
        is_active: true,
      },
      order: { created_at: "DESC" },
    });
  }

  async getAggregateBalance(
    businessId: string,
  ): Promise<{ total_balance: number }> {
    const packages = await this.businessPointPackageRepository.find({
      where: {
        business: { id: businessId },
        status: BusinessPointPackageStatus.ACTIVE,
      },
    });

    const total_balance = packages.reduce(
      (sum, pkg) => sum + pkg.remaining_points,
      0,
    );

    return { total_balance };
  }
}
