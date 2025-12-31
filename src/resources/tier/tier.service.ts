import {
  Injectable,
  ConflictException,
  NotFoundException,
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
  ) { }

  private async createHistory(tier: Tier, admin: Admin) {
    const history = this.tierHistoryRepository.create({
      ...tier,
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

    const tier = this.tierRepository.create(createTierDto);

    if (createTierDto.type === TierType.SEASONAL && createTierDto.season_id) {
      const season = await this.seasonRepository.findOne({
        where: { id: createTierDto.season_id } as any,
      });
      if (season) {
        tier.start_date = season.startDate;
        tier.end_date = season.endDate;
      }
    }

    const savedTier = await this.tierRepository.save(tier);
    await this.createHistory(savedTier, admin);
    return savedTier;
  }

  async findAll(type?: string) {
    if (type && type !== "all") {
      return await this.tierRepository.find({
        where: { type: type as TierType },
      });
    }
    return await this.tierRepository.find();
  }

  async findOne(id: string) {
    return await this.tierRepository.findOne({ where: { id } });
  }

  async update(id: string, updateTierDto: UpdateTierDto, admin: Admin) {
    const tier = await this.findOne(id);
    if (!tier) {
      throw new NotFoundException("Tier not found");
    }

    const updatedData = { ...updateTierDto };

    if (
      (updateTierDto.type === TierType.SEASONAL ||
        tier.type === TierType.SEASONAL) &&
      updateTierDto.season_id
    ) {
      const season = await this.seasonRepository.findOne({
        where: { id: updateTierDto.season_id } as any,
      });
      if (season) {
        updatedData.start_date = season.startDate;
        updatedData.end_date = season.endDate;
      }
    }

    await this.tierRepository.update(id, updatedData);
    const updatedTier = await this.findOne(id);
    await this.createHistory(updatedTier, admin);
    return updatedTier;
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
