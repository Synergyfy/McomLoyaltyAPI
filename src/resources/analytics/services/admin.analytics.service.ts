import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Business } from '../../business/entities/business.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Participant } from '../../participant/entities/participant.entity';
import {
  PointHistory,
  PointHistoryType,
} from '../../participant-campaign-balance/entities/point-history.entity';
import { Reward } from '../../reward/entities/reward.entity';
import {
  SystemOverviewDto,
  TopBusinessDto,
  TopRewardDto,
} from '../dto/admin_analytics.dto';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
  ) {}

  async getSystemOverview(): Promise<SystemOverviewDto> {
    const totalCampaigns = await this.campaignRepository.count();
    const totalParticipants = await this.participantRepository.count();
    const totalRedemptions = await this.pointHistoryRepository.count({
      where: { type: PointHistoryType.REDEEM },
    });

    return {
      totalCampaigns,
      totalParticipants,
      totalRedemptions,
    };
  }

  async getTopBusinesses(): Promise<TopBusinessDto[]> {
    const topBusinesses = await this.businessRepository
      .createQueryBuilder('business')
      .leftJoin('business.campaigns', 'campaign')
      .select('business.id', 'id')
      .addSelect('business.name', 'name')
      .addSelect('SUM(campaign.total_points_earned)', 'totalPointsEarned')
      .addSelect('SUM(campaign.total_points_redeemed)', 'totalPointsRedeemed')
      .groupBy('business.id')
      .orderBy('SUM(campaign.total_points_earned) + SUM(campaign.total_points_redeemed)', 'DESC')
      .limit(10)
      .getRawMany();

    return topBusinesses.map((b) => ({
      ...b,
      totalPointsEarned: parseInt(b.totalPointsEarned, 10) || 0,
      totalPointsRedeemed: parseInt(b.totalPointsRedeemed, 10) || 0,
    }));
  }

  async getTopRewards(): Promise<TopRewardDto[]> {
    const topRewards = await this.pointHistoryRepository
      .createQueryBuilder('ph')
      .leftJoin('ph.reward', 'reward')
      .select('reward.id', 'id')
      .addSelect('reward.name', 'name')
      .addSelect('COUNT(ph.id)', 'totalRedemptions')
      .where('ph.type = :type', { type: PointHistoryType.REDEEM })
      .andWhere('reward.id IS NOT NULL')
      .groupBy('reward.id')
      .orderBy('"totalRedemptions"', 'DESC')
      .limit(10)
      .getRawMany();

    return topRewards.map((r) => ({
      ...r,
      totalRedemptions: parseInt(r.totalRedemptions, 10),
    }));
  }
}
