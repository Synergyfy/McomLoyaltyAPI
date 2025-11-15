import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { BusinessReward } from '../entities/business-reward.entity';
import { CreateBusinessRewardDto } from '../dto/create-business-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
  ) {}

  // Admin methods
  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    const reward = this.rewardRepository.create(createRewardDto);
    return this.rewardRepository.save(reward);
  }

  async getRewards(page: number, limit: number): Promise<{ data: Reward[], total: number }> {
    const [data, total] = await this.rewardRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async updateReward(id: string, updateRewardDto: UpdateRewardDto): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    Object.assign(reward, updateRewardDto);
    return this.rewardRepository.save(reward);
  }


  //TODO: Soft delete
  async deleteReward(id: string): Promise<void> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    const businessReward = await this.businessRewardRepository.findOne({ where: { reward: { id } } });
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
  async addRewardToBusiness(rewardId: string, businessId: string, createBusinessRewardDto: CreateBusinessRewardDto): Promise<BusinessReward> {
    const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    if (reward.disabled) {
      throw new ConflictException('Reward is disabled');
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
    });

    return this.businessRewardRepository.save(businessReward);
  }

  async getBusinessRewards(businessId: string, page: number, limit: number): Promise<{ data: BusinessReward[], total: number }> {
    const [data, total] = await this.businessRewardRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['reward'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async removeRewardFromBusiness(rewardId: string, businessId: string): Promise<void> {
    await this.businessRewardRepository.delete({
      reward: { id: rewardId },
      business: { id: businessId },
    });
  }
}
