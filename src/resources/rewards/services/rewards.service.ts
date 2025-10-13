import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from 'src/resources/rewards/entities/reward.entity';
import { CreateRewardDto } from 'src/resources/rewards/dto/create-reward.dto';
import { BusinessReward } from 'src/resources/rewards/entities/business-reward.entity';
import { CreateBusinessRewardDto } from 'src/resources/rewards/dto/create-business-reward.dto';

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

  // Business methods
  async addRewardToBusiness(rewardId: string, businessId: string, createBusinessRewardDto: CreateBusinessRewardDto): Promise<BusinessReward> {
    const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
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

  async removeRewardFromBusiness(rewardId: string, businessId: string): Promise<void> {
    await this.businessRewardRepository.delete({
      reward: { id: rewardId },
      business: { id: businessId },
    });
  }
}
