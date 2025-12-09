import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { BusinessReward } from '../entities/business-reward.entity';
import { CreateBusinessRewardDto } from '../dto/create-business-reward.dto';
import { UpdateBusinessRewardDto } from '../dto/update-business-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';
import { Business } from '../../business/entities/business.entity';
import { RewardStatus } from '../enums/reward-status.enum';
import { RewardAudience } from '../enums/reward-audience.enum';
import { Membership } from '../../membership/entities/membership.entity';
import { Sector } from '../../sector/entities/sector.entity';
import { Tier } from '../../tier/entities/tier.entity';
import { In, Brackets } from 'typeorm';
import { PaginationResult } from '../../../common/interfaces/pagination-result.interface';
import { TierProgressionService } from '../../tier-progression/tier-progression.service';
import { RewardSource } from '../enums/reward-source.enum';
import { MembershipStatus } from '../../membership/entities/membership.entity';
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';

import { AddRewardToBusinessDto } from '../dto/add-reward-to-business.dto';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @Inject(forwardRef(() => TierProgressionService))
    private readonly tierProgressionService: TierProgressionService,
  ) { }

  // Admin methods
  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    const { sector_ids, tier_ids, ...rewardData } = createRewardDto;

    let sectors: Sector[] = [];
    if (sector_ids && sector_ids.length > 0) {
      sectors = await this.sectorRepository.findBy({ id: In(sector_ids) });
      if (sectors.length !== sector_ids.length) {
        throw new NotFoundException('One or more sectors not found');
      }
    }

    let tiers: Tier[] = [];
    if (tier_ids && tier_ids.length > 0) {
      tiers = await this.tierRepository.findBy({ id: In(tier_ids) });
      if (tiers.length !== tier_ids.length) {
        throw new NotFoundException('One or more tiers not found');
      }
    }

    const reward = this.rewardRepository.create({
      ...rewardData,
      sectors: sectors,
      tiers: tiers,
    });
    return this.rewardRepository.save(reward);
  }

  async getRewards(
    page: number,
    limit: number,
  ): Promise<PaginationResult<Reward>> {
    const [data, total] = await this.rewardRepository.findAndCount({
      order: { created_at: 'DESC' },
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

  async updateReward(
    id: string,
    updateRewardDto: UpdateRewardDto,
  ): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    Object.assign(reward, updateRewardDto);
    return this.rewardRepository.save(reward);
  }

  async deleteReward(id: string): Promise<void> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    const businessReward = await this.businessRewardRepository.findOne({
      where: { reward: { id } },
    });
    if (businessReward) {
      throw new ConflictException('Reward is in use by a business');
    }
    await this.rewardRepository.delete(id);
  }

  async disableReward(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    reward.disabled = true;
    return this.rewardRepository.save(reward);
  }

  async enableReward(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    reward.disabled = false;
    return this.rewardRepository.save(reward);
  }

  // Business methods
  async addRewardToBusiness(
    rewardId: string,
    businessId: string,
    addRewardToBusinessDto: AddRewardToBusinessDto,
  ): Promise<BusinessReward> {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
      relations: ['sectors', 'tiers'],
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    if (reward.status !== RewardStatus.ACTIVE) {
      throw new ForbiddenException('Reward is not active');
    }

    if (reward.expiry_datetime && new Date(reward.expiry_datetime) < new Date()) {
      throw new ForbiddenException('Reward has expired');
    }

    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['sector'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (reward.audience === RewardAudience.SPECIFIC_SECTORS) {
      if (!reward.sectors.some((sector) => sector.id === business.sector.id)) {
        throw new ForbiddenException(
          'Business does not belong to the required sector for this reward',
        );
      }
    }

    if (reward.audience === RewardAudience.SPECIFIC_TIERS) {
      const membership = await this.membershipRepository.findOne({
        where: { business: { id: businessId } },
      });
      if (!membership || !membership.tier) {
        throw new ForbiddenException('Business does not have a tier');
      }
      if (!reward.tiers.some((tier) => tier.id === membership.tier.id)) {
        throw new ForbiddenException(
          'Business does not belong to the required tier for this reward',
        );
      }
    }

    const existingBusinessReward = await this.businessRewardRepository.findOne({
      where: {
        reward: { id: rewardId },
        business: { id: businessId },
      },
    });

    if (existingBusinessReward) {
      throw new ConflictException('Business already has this reward');
    }

    const pointRequired = addRewardToBusinessDto.point_required ?? reward.max_points;
    const quantity = addRewardToBusinessDto.quantity ?? reward.quantity;

    if (pointRequired > reward.max_points) {
      throw new ForbiddenException(
        `Points required cannot exceed the maximum points set by admin (${reward.max_points})`,
      );
    }

    const businessReward = this.businessRewardRepository.create({
      reward,
      business: { id: businessId },
      title: reward.title,
      reward_type: reward.reward_type,
      reward_source: reward.reward_source,
      audience: reward.audience,
      expiry_datetime: reward.expiry_datetime,
      status: reward.status,
      description: reward.description,
      image: reward.image,
      disabled: reward.disabled,
      point_required: pointRequired,
      quantity: quantity,
      remaining_quantity: quantity,
    });

    return this.businessRewardRepository.save(businessReward);
  }

  async createBusinessReward(
    businessId: string,
    createBusinessRewardDto: CreateBusinessRewardDto,
  ): Promise<BusinessReward> {
    const membership = await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ['tier'],
    });

    if (!membership || !membership.tier) {
      throw new ForbiddenException('Business does not have a valid membership or tier');
    }

    // Check if the tier allows creating rewards from scratch
    if (!membership.tier.configuration?.featureFlags?.canCreateRewardFromScratch) {
      throw new ForbiddenException('Your current tier does not allow creating rewards from scratch');
    }

    const businessReward = this.businessRewardRepository.create({
      ...createBusinessRewardDto,
      business: { id: businessId },
      reward_source: RewardSource.BUSINESS,
      audience: RewardAudience.ALL_BUSINESS,
      remaining_quantity: createBusinessRewardDto.quantity,
    });

    const savedReward = await this.businessRewardRepository.save(businessReward);

    // Check for promotion
    await this.tierProgressionService.checkAndPromote(businessId);

    return savedReward;
  }

  async getBusinessRewards(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<BusinessReward>> {
    const [data, total] = await this.businessRewardRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['reward'],
      order: { created_at: 'DESC' },
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

  async removeRewardFromBusiness(
    rewardId: string,
    businessId: string,
  ): Promise<void> {
    const activeCampaignsCount = await this.businessCampaignRepository
      .createQueryBuilder('businessCampaign')
      .innerJoin('businessCampaign.rewards', 'reward')
      .innerJoin('businessCampaign.participants', 'participant')
      .where('reward.id = :rewardId', { rewardId })
      .andWhere('businessCampaign.business.id = :businessId', { businessId })
      .andWhere('businessCampaign.end_date > :now', { now: new Date() })
      .andWhere('businessCampaign.disabled = :disabled', { disabled: false })
      .getCount();

    if (activeCampaignsCount > 0) {
      throw new ConflictException(
        'Cannot remove reward because it is being used in an active campaign with participants.',
      );
    }

    await this.businessRewardRepository.delete({
      id: rewardId,
      business: { id: businessId },
    });
  }

  async getUnaddedRewards(
    businessId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginationResult<Reward>> {
    // Get IDs of rewards already added by the business
    const addedRewards = await this.businessRewardRepository.find({
      where: { business: { id: businessId } },
      relations: ['reward'],
      select: ['reward'],
    });
    const addedRewardIds = addedRewards
      .map((br) => br.reward?.id)
      .filter((id) => id !== undefined);

    const queryBuilder = this.rewardRepository.createQueryBuilder('reward');

    queryBuilder
      .where('reward.status = :status', { status: RewardStatus.ACTIVE })
      .andWhere('reward.disabled = :disabled', { disabled: false });

    if (addedRewardIds.length > 0) {
      queryBuilder.andWhere('reward.id NOT IN (:...addedRewardIds)', {
        addedRewardIds,
      });
    }

    // Also check expiry
    queryBuilder.andWhere(
      '(reward.expiry_datetime IS NULL OR reward.expiry_datetime > :now)',
      { now: new Date() },
    );

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('reward.title ILIKE :search', { search: `%${search}%` })
            .orWhere('reward.description ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    queryBuilder
      .orderBy('reward.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Filter by audience
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['sector'],
    });

    const membership = await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ['tier'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const tierId = membership.tier?.id;

    queryBuilder.andWhere(
      new Brackets((qb) => {
        // 1. Check Tier (Priority check)
        if (tierId) {
          qb.where(
            '(reward.audience = :tierAudience AND :tierId = ANY(SELECT "tierId" FROM "reward_tiers_tier" WHERE "rewardId" = reward.id))',
            {
              tierAudience: RewardAudience.SPECIFIC_TIERS,
              tierId: tierId,
            },
          );
        } else {
          qb.where('1=0');
        }

        // 2. Check All Business
        qb.orWhere('reward.audience = :allAudience', {
          allAudience: RewardAudience.ALL_BUSINESS,
        });

        // 3. Check Sector
        if (business.sector) {
          qb.orWhere(
            '(reward.audience = :sectorAudience AND :sectorId = ANY(SELECT "sectorId" FROM "reward_sectors_sector" WHERE "rewardId" = reward.id))',
            {
              sectorAudience: RewardAudience.SPECIFIC_SECTORS,
              sectorId: business.sector.id,
            },
          );
        }
      }),
    );

    const [data, total] = await queryBuilder.getManyAndCount();

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

  async countActiveBusinessRewards(businessId: string): Promise<number> {
    return this.businessRewardRepository.count({
      where: {
        business: { id: businessId },
        status: RewardStatus.ACTIVE,
        disabled: false,
      },
    });
  }

  async updateBusinessReward(
    businessId: string,
    rewardId: string,
    updateBusinessRewardDto: UpdateBusinessRewardDto,
  ): Promise<BusinessReward> {
    const businessReward = await this.businessRewardRepository.findOne({
      where: {
        id: rewardId,
        business: { id: businessId },
      },
      relations: ['reward'],
    });

    if (!businessReward) {
      throw new NotFoundException('Reward not found or does not belong to this business');
    }

    if (
      updateBusinessRewardDto.point_required !== undefined &&
      businessReward.reward
    ) {
      if (updateBusinessRewardDto.point_required > businessReward.reward.max_points) {
        throw new ForbiddenException(
          `Points required cannot exceed the maximum points set by admin (${businessReward.reward.max_points})`,
        );
      }
    }

    Object.assign(businessReward, updateBusinessRewardDto);
    return this.businessRewardRepository.save(businessReward);
  }

  async countTotalRewards(userId: string): Promise<number> {
    return await this.businessRewardRepository.count({
      where: { business: { id: userId } },
    });
  }
}
