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
import { Reward } from '../../rewards/entities/reward.entity';
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

  /**
   * Retrieves a high-level overview of the entire system.
   * @returns A promise that resolves to an object containing total campaigns, participants, and redemptions.
   */
  async getSystemOverview(): Promise<SystemOverviewDto> {
    // Count all campaigns in the database.
    const totalCampaigns = await this.campaignRepository.count();
    // Count all participants in the database.
    const totalParticipants = await this.participantRepository.count();
    // Count all point history records specifically for reward redemptions.
    const totalRedemptions = await this.pointHistoryRepository.count({
      where: { type: PointHistoryType.REDEEM },
    });
    // Count all businesses in the database.
    const totalBusiness = await this.businessRepository.count();
    // Calculate the sum of all referral points from all businesses.
    const { totalMatchingPoints } = await this.businessRepository
      .createQueryBuilder('business')
      .select('SUM(business.referralPoints)', 'totalMatchingPoints')
      .getRawOne();

    return {
      totalCampaigns,
      totalParticipants,
      totalRedemptions,
      totalBusiness,
      totalMatchingPoints: parseInt(totalMatchingPoints, 10) || 0,
    };
  }

  /**
   * Retrieves the top 10 performing businesses based on the sum of points earned and redeemed in their campaigns.
   * @returns A promise that resolves to a list of the top 10 businesses.
   */
  async getTopBusinesses(): Promise<TopBusinessDto[]> {
    const topBusinesses = await this.businessRepository
      .createQueryBuilder('business')
      // Join with campaigns to access point totals.
      .leftJoin('business.campaigns', 'campaign')
      // Select the business ID and name.
      .select('business.id', 'id')
      .addSelect('business.name', 'name')
      // Sum the points earned and redeemed for all campaigns associated with each business.
      .addSelect('SUM(campaign.total_points_earned)', 'totalPointsEarned')
      .addSelect('SUM(campaign.total_points_redeemed)', 'totalPointsRedeemed')
      // Group the results by business to aggregate the sums correctly.
      .groupBy('business.id')
      // Order by the combined total of earned and redeemed points in descending order to find the top performers.
      .orderBy('SUM(campaign.total_points_earned) + SUM(campaign.total_points_redeemed)', 'DESC')
      // Limit the result to the top 10.
      .limit(10)
      .getRawMany();

    // The raw query returns strings, so we parse them into numbers.
    // Use `|| 0` to handle cases where a business may not have any campaign data, resulting in null sums.
    return topBusinesses.map((b) => ({
      ...b,
      totalPointsEarned: parseInt(b.totalPointsEarned, 10) || 0,
      totalPointsRedeemed: parseInt(b.totalPointsRedeemed, 10) || 0,
    }));
  }

  /**
   * Retrieves the top 10 most popular rewards based on the number of times they have been redeemed.
   * @returns A promise that resolves to a list of the top 10 rewards.
   */
  async getTopRewards(): Promise<TopRewardDto[]> {
    const topRewards = await this.pointHistoryRepository
      .createQueryBuilder('ph')
      // Join with the reward entity to get reward details.
      .leftJoin('ph.reward', 'reward')
      // Select the reward ID and name.
      .select('reward.id', 'id')
      .addSelect('reward.title', 'name')
      // Count the number of point history records for each reward, which corresponds to the number of redemptions.
      .addSelect('COUNT(ph.id)', 'totalRedemptions')
      // Filter the history records to only include redemptions.
      .where('ph.type = :type', { type: PointHistoryType.REDEEM })
      // Ensure we only count records that are linked to a reward.
      .andWhere('reward.id IS NOT NULL')
      // Group by reward to count redemptions for each unique reward.
      .groupBy('reward.id')
      // Order by the redemption count in descending order.
      .orderBy('"totalRedemptions"', 'DESC')
      // Limit to the top 10 rewards.
      .limit(10)
      .getRawMany();

    // Parse the redemption count from a string to a number.
    return topRewards.map((r) => ({
      ...r,
      totalRedemptions: parseInt(r.totalRedemptions, 10),
    }));
  }
}
