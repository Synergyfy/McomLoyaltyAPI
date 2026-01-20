import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tier } from "./entities/tier.entity";
import { TierType } from "./entities/tier-type.enum";
import { CreateTierDto } from "./dto/create-tier.dto";
import { UpdateTierDto } from "./dto/update-tier.dto";
import { Season } from "../season/entities/season.entity";
import { UpdateTierProgressionDto } from "./dto/update-tier-progression.dto";
import { TierHistory } from "./entities/tier-history.entity";
import { Admin } from "../admin/entities/admin.entity";
import { Membership } from "../membership/entities/membership.entity";
import { Role } from "../../common/role.enum";

@Injectable()
export class TierService {
  constructor(
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(TierHistory)
    private readonly tierHistoryRepository: Repository<TierHistory>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  private async createHistory(tier: Tier, admin: Admin) {
    const history = this.tierHistoryRepository.create({
      name: tier.name,
      monthly_price: tier.monthly_price,
      quarterly_price: tier.quarterly_price,
      annual_price: tier.annual_price,
      features: tier.features,
      status: tier.status,
      tier,
      admin,
    });
    await this.tierHistoryRepository.save(history);
  }

  async create(createTierDto: CreateTierDto, admin: Admin) {
    const existingTier = await this.tierRepository.findOne({
      where: { name: createTierDto.name },
    });
    if (existingTier) {
      throw new ConflictException("A tier with this name already exists");
    }

    try {
      const tier = this.tierRepository.create(createTierDto);
      const savedTier = await this.tierRepository.save(tier);
      await this.createHistory(savedTier, admin);
      return savedTier;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create tier: ${error.message}`,
      );
    }
  }

  async findAll(type?: string) {
    const where: any = {};
    if (type && type !== "all") {
      where.type = type as TierType;
    }
    return await this.tierRepository.find({
      where,
      relations: ["season"],
    });
  }

  async findOne(id: string) {
    return await this.tierRepository.findOne({
      where: { id },
      relations: ["season"],
    });
  }

  async update(id: string, updateTierDto: UpdateTierDto, admin: Admin) {
    const tier = await this.findOne(id);
    if (!tier) {
      throw new NotFoundException("Tier not found");
    }

    try {
      await this.tierRepository.update(id, updateTierDto);
      const updatedTier = await this.findOne(id);
      await this.createHistory(updatedTier, admin);
      return updatedTier;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update tier: ${error.message}`,
      );
    }
  }

  async updateProgression(
    id: string,
    progressionDto: UpdateTierProgressionDto,
    admin: Admin,
  ) {
    const tier = await this.findOne(id);
    if (!tier) {
      throw new NotFoundException("Tier not found");
    }

    // Merge progression config into existing configuration
    tier.configuration = {
      ...tier.configuration,
      ...progressionDto,
    };

    await this.tierRepository.save(tier);
    await this.createHistory(tier, admin);
    return tier;
  }

  async remove(id: string, admin: Admin) {
    const tier = await this.findOne(id);
    await this.tierRepository.softDelete(id);
    await this.createHistory(tier, admin);
  }

  async getTierBreakdown() {
    const tiers = await this.tierRepository.find();
    const breakdown = await Promise.all(
      tiers.map(async (tier) => {
        const count = await this.membershipRepository.count({
          where: {
            tier: { id: tier.id },
            // user_type removed from Membership entity
          },
        });
        return {
          ...tier,
          businessCount: count,
        };
      }),
    );
    return breakdown;
  }
}
