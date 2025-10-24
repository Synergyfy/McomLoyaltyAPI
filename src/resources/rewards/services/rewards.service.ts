import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { BusinessReward } from '../entities/business-reward.entity';
import { CreateBusinessRewardDto } from '../dto/create-business-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';
import { RewardImage } from '../entities/reward-image.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(RewardImage)
    private readonly rewardImageRepository: Repository<RewardImage>,
  ) {}

  // Admin methods
  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    const { images, ...rest } = createRewardDto;
    const reward = this.rewardRepository.create(rest);
    if (images && images.length > 0) {
      reward.images = images.map((url) => this.rewardImageRepository.create({ url }));
    }
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
    const { images, ...rest } = updateRewardDto;
    const reward = await this.rewardRepository.findOne({ where: { id }, relations: ['images'] });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    Object.assign(reward, rest);

    if (images) {
      if (reward.images && reward.images.length > 0) {
        await this.rewardImageRepository.remove(reward.images);
      }
      reward.images = images.map((url) => this.rewardImageRepository.create({ url }));
    }

    return this.rewardRepository.save(reward);
  }

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

  async removeRewardFromBusiness(rewardId: string, businessId: string): Promise<void> {
    await this.businessRewardRepository.delete({
      reward: { id: rewardId },
      business: { id: businessId },
    });
  }
}
