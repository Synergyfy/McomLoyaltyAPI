import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, EntityManager } from "typeorm";
import { StampPackage } from "../entities/stamp-package.entity";
import {
  BusinessStampPackage,
  BusinessStampPackageStatus,
} from "../entities/business-stamp-package.entity";
import { CreateStampPackageDto } from "../dto/create-stamp-package.dto";
import { UpdateStampPackageDto } from "../dto/update-stamp-package.dto";
import { Tier } from "../../tier/entities/tier.entity";
import { PaginationResult } from "../../../common/interfaces/pagination-result.interface";
import { PaymentService } from "../../payment/payment.service";
import { PackageType } from "../../payment/dto/package-purchase.dto";
import {
  PointHistory,
  PointHistoryType,
} from "../../participant-campaign-balance/entities/point-history.entity";

@Injectable()
export class StampPackageService {
  constructor(
    @InjectRepository(StampPackage)
    private readonly stampPackageRepository: Repository<StampPackage>,
    @InjectRepository(BusinessStampPackage)
    private readonly businessStampPackageRepository: Repository<BusinessStampPackage>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly paymentService: PaymentService,
  ) {}

  async create(dto: CreateStampPackageDto): Promise<StampPackage> {
    const { tier_ids, ...rest } = dto;
    const tiers = await this.tierRepository.findBy({ id: In(tier_ids) });
    if (tiers.length !== tier_ids.length) {
      throw new NotFoundException("One or more tiers not found");
    }

    const stampPackage = this.stampPackageRepository.create({
      ...rest,
      tiers,
    });

    return this.stampPackageRepository.save(stampPackage);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginationResult<StampPackage>> {
    const [data, total] = await this.stampPackageRepository.findAndCount({
      relations: ["tiers"],
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async findOne(id: string): Promise<StampPackage> {
    const pkg = await this.stampPackageRepository.findOne({
      where: { id },
      relations: ["tiers"],
    });
    if (!pkg) throw new NotFoundException("Stamp package not found");
    return pkg;
  }

  async update(id: string, dto: UpdateStampPackageDto): Promise<StampPackage> {
    const pkg = await this.findOne(id);
    const { tier_ids, ...rest } = dto;

    if (tier_ids) {
      const tiers = await this.tierRepository.findBy({ id: In(tier_ids) });
      if (tiers.length !== tier_ids.length) {
        throw new NotFoundException("One or more tiers not found");
      }
      pkg.tiers = tiers;
    }

    Object.assign(pkg, rest);
    return this.stampPackageRepository.save(pkg);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stampPackageRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException("Stamp package not found");
  }

  async getAvailablePackages(
    tierId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<StampPackage>> {
    const [data, total] = await this.stampPackageRepository
      .createQueryBuilder("package")
      .innerJoin("package.tiers", "tier")
      .where("tier.id = :tierId", { tierId })
      .andWhere("package.is_active = :isActive", { isActive: true })
      .orderBy("package.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next: page < totalPages ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async buyPackage(businessId: string, packageId: string, provider: string) {
    const pkg = await this.findOne(packageId);
    if (!pkg.is_active) throw new BadRequestException("Package is not active");

    return this.paymentService.initiatePackagePurchase(
      { id: businessId },
      packageId,
      pkg.price,
      provider,
      PackageType.STAMP,
      pkg.name,
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

    const pkg = await this.findOne(verification.packageId);

    const businessPackage = this.businessStampPackageRepository.create({
      business: { id: businessId },
      package: pkg,
      name: pkg.name,
      initial_stamps: pkg.stamps,
      remaining_stamps: pkg.stamps,
      transaction_id: verification.transactionId,
      status: BusinessStampPackageStatus.ACTIVE,
    });

    await this.businessStampPackageRepository.save(businessPackage);

    return {
      success: true,
      package: businessPackage,
    };
  }

  async getMyPackages(businessId: string) {
    return this.businessStampPackageRepository.find({
      where: { business: { id: businessId } },
      order: { created_at: "DESC" },
    });
  }

  async deductStamps(
    businessId: string,
    stamps: number,
    manager: EntityManager,
    context?: {
      participantId?: string;
      campaignId?: string;
      rewardId?: string;
      businessRewardId?: string;
      description?: string;
    },
  ) {
    const packages = await manager.find(BusinessStampPackage, {
      where: {
        business: { id: businessId },
        status: BusinessStampPackageStatus.ACTIVE,
      },
      order: { created_at: "ASC" }, // FIFO
    });

    let stampsToDeduct = stamps;

    for (const pkg of packages) {
      if (stampsToDeduct <= 0) break;

      if (pkg.remaining_stamps > 0) {
        const deduction = Math.min(pkg.remaining_stamps, stampsToDeduct);
        pkg.remaining_stamps -= deduction;
        stampsToDeduct -= deduction;

        if (pkg.remaining_stamps === 0) {
          pkg.status = BusinessStampPackageStatus.DEPLETED;
        }

        await manager.save(BusinessStampPackage, pkg);
      }
    }

    if (stampsToDeduct > 0) {
      throw new BadRequestException(
        `Insufficient stamps. You need ${stampsToDeduct} more stamps from packages.`,
      );
    }

    // Log usage
    const history = manager.create(PointHistory, {
      business: { id: businessId },
      type: PointHistoryType.BUSINESS_STAMP_SPENT,
      stamps: stamps,
      points: 0,
      description: context?.description || "Stamps spent",
      participant: context?.participantId
        ? { id: context.participantId }
        : null,
      campaign: context?.campaignId ? { id: context.campaignId } : null,
      reward: context?.rewardId ? { id: context.rewardId } : null,
      businessReward: context?.businessRewardId
        ? { id: context.businessRewardId }
        : null,
    });

    await manager.save(PointHistory, history);
  }

  async getAggregateBalance(
    businessId: string,
  ): Promise<{ total_balance: number }> {
    const packages = await this.businessStampPackageRepository.find({
      where: {
        business: { id: businessId },
        status: BusinessStampPackageStatus.ACTIVE,
      },
    });

    const total_balance = packages.reduce(
      (sum, pkg) => sum + pkg.remaining_stamps,
      0,
    );
    return { total_balance };
  }
}
