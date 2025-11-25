import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { BusinessReward } from '../entities/business-reward.entity';
import { CreateBusinessRewardDto } from '../dto/create-business-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';
import { Business } from '../../business/entities/business.entity';
import { RewardStatus } from '../enums/reward-status.enum';
import { RewardAudience } from '../enums/reward-audience.enum';
import { Membership } from '../../membership/entities/membership.entity';
import { Sector } from '../../sector/entities/sector.entity';
import { Tier } from '../../tier/entities/tier.entity';
import { In, Brackets } from 'typeorm';

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
  ): Promise<{ data: Reward[]; total: number }> {
    const [data, total] = await this.rewardRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
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
    createBusinessRewardDto: CreateBusinessRewardDto,
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
        where: { user_id: businessId, user_type: 'business' },
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

    const businessReward = this.businessRewardRepository.create({
      ...createBusinessRewardDto,
      reward,
      business: { id: businessId },
      title: reward.title,
      reward_type: reward.reward_type,
      badge_level: reward.badge_level,
      reward_source: reward.reward_source,
      audience: reward.audience,
      expiry_datetime: reward.expiry_datetime,
      status: reward.status,
      value: reward.value,
      description: reward.description,
      image: reward.image,
      disabled: reward.disabled,
    });

    return this.businessRewardRepository.save(businessReward);
  }

  async getBusinessRewards(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<{ data: BusinessReward[]; total: number }> {
    const [data, total] = await this.businessRewardRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['reward'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async removeRewardFromBusiness(
    rewardId: string,
    businessId: string,
  ): Promise<void> {
    await this.businessRewardRepository.delete({
      reward: { id: rewardId },
      business: { id: businessId },
    });
  }

  async getUnaddedRewards(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Reward[]; total: number }> {
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

    queryBuilder
      .orderBy('reward.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }
}
