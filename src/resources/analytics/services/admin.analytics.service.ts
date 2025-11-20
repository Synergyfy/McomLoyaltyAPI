import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as moment from 'moment';

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
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';
import { ParticipantCampaignBalance } from '../../participant-campaign-balance/entities/participant-campaign-balance.entity';
import {
  GrowthActivityChartDto,
  GrowthActivityResponseDto,
} from '../dto/growth-activity-chart.dto';

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
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
  ) {}

  /**
   * Retrieves a high-level overview of the entire system.
   * @returns A promise that resolves to an object containing total campaigns, participants, and redemptions.
   */
  async getSystemOverview(): Promise<SystemOverviewDto> {
    const totalCampaigns = await this.campaignRepository.count();
    const totalParticipants = await this.participantRepository.count();
    const totalRedemptions = await this.pointHistoryRepository.count({
      where: { type: PointHistoryType.REDEEM },
    });
    const totalBusiness = await this.businessRepository.count();
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
      .leftJoin('business.campaigns', 'campaign')
      .select('business.id', 'id')
      .addSelect('business.name', 'name')
      .addSelect('SUM(campaign.total_points_earned)', 'totalPointsEarned')
      .addSelect('SUM(campaign.total_points_redeemed)', 'totalPointsRedeemed')
      .groupBy('business.id')
      .orderBy(
        'SUM(campaign.total_points_earned) + SUM(campaign.total_points_redeemed)',
        'DESC',
      )
      .limit(10)
      .getRawMany();

    return topBusinesses.map((b) => ({
      ...b,
      totalPointsEarned: parseInt(b.totalPointsEarned, 10) || 0,
      totalPointsRedeemed: parseInt(b.totalPointsRedeemed, 10) || 0,
    }));
  }

  /**
   * Retrieves the top 10 most popular rewards based on the number of times they have been redeemed.
   * This includes rewards from both admin-created and business-created campaigns.
   * @returns A promise that resolves to a list of the top 10 rewards.
   */
  async getTopRewards(): Promise<TopRewardDto[]> {
    const topRewards = await this.pointHistoryRepository
      .createQueryBuilder('ph')
      .select('reward.id', 'id')
      .addSelect('reward.title', 'name')
      .addSelect('COUNT(ph.id)', 'totalRedemptions')
      .innerJoin('ph.reward', 'reward')
      .where('ph.type = :type', { type: PointHistoryType.REDEEM })
      .groupBy('reward.id, reward.title')
      .orderBy('"totalRedemptions"', 'DESC')
      .limit(10)
      .getRawMany();

    return topRewards.map((r) => ({
      ...r,
      totalRedemptions: parseInt(r.totalRedemptions, 10) || 0,
    }));
  }

  /**
   * Retrieves growth and activity chart data for the admin dashboard.
   * @param dto The filtering options (startDate, endDate).
   * @returns Chart data with labels and datasets.
   */
  async getGrowthActivityChart(
    dto: GrowthActivityChartDto,
  ): Promise<GrowthActivityResponseDto> {
    const startDate = dto.startDate
      ? moment(dto.startDate).startOf('day')
      : moment().subtract(30, 'days').startOf('day');
    const endDate = dto.endDate
      ? moment(dto.endDate).endOf('day')
      : moment().endOf('day');

    const days = endDate.diff(startDate, 'days') + 1;
    const labels: string[] = [];
    const registrations: number[] = [];
    const activities: number[] = [];

    // Initialize map for aggregation
    const dataMap = new Map<
      string,
      { registrations: number; activities: number }
    >();

    for (let i = 0; i < days; i++) {
      const date = startDate.clone().add(i, 'days').format('YYYY-MM-DD');
      labels.push(date);
      dataMap.set(date, { registrations: 0, activities: 0 });
    }

    // 1. Registrations: Businesses
    const newBusinesses = await this.businessRepository
      .createQueryBuilder('business')
      .select("TO_CHAR(business.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(business.id)', 'count')
      .where('business.created_at BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .groupBy("TO_CHAR(business.created_at, 'YYYY-MM-DD')")
      .getRawMany();

    newBusinesses.forEach((item) => {
      if (dataMap.has(item.date)) {
        dataMap.get(item.date).registrations += parseInt(item.count, 10);
      }
    });

    // 2. Registrations: Participants
    const newParticipants = await this.participantRepository
      .createQueryBuilder('participant')
      .select("TO_CHAR(participant.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(participant.id)', 'count')
      .where('participant.created_at BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .groupBy("TO_CHAR(participant.created_at, 'YYYY-MM-DD')")
      .getRawMany();

    newParticipants.forEach((item) => {
      if (dataMap.has(item.date)) {
        dataMap.get(item.date).registrations += parseInt(item.count, 10);
      }
    });

    // 3. Activities: Point History (EARN & REDEEM)
    const pointActivities = await this.pointHistoryRepository
      .createQueryBuilder('ph')
      .select("TO_CHAR(ph.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(ph.id)', 'count')
      .where('ph.created_at BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .andWhere('ph.type IN (:...types)', {
        types: [PointHistoryType.EARN, PointHistoryType.REDEEM],
      })
      .groupBy("TO_CHAR(ph.created_at, 'YYYY-MM-DD')")
      .getRawMany();

    pointActivities.forEach((item) => {
      if (dataMap.has(item.date)) {
        dataMap.get(item.date).activities += parseInt(item.count, 10);
      }
    });

    // 4. Activities: Joining Campaigns (ParticipantCampaignBalance created)
    const joinActivities = await this.participantCampaignBalanceRepository
      .createQueryBuilder('pcb')
      .select("TO_CHAR(pcb.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(pcb.id)', 'count')
      .where('pcb.created_at BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .groupBy("TO_CHAR(pcb.created_at, 'YYYY-MM-DD')")
      .getRawMany();

    joinActivities.forEach((item) => {
      if (dataMap.has(item.date)) {
        dataMap.get(item.date).activities += parseInt(item.count, 10);
      }
    });

    // 5. Activities: Campaigns Created by Business (BusinessCampaign)
    const businessCampaignActivities = await this.businessCampaignRepository
      .createQueryBuilder('bc')
      .select("TO_CHAR(bc.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(bc.id)', 'count')
      .where('bc.created_at BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .groupBy("TO_CHAR(bc.created_at, 'YYYY-MM-DD')")
      .getRawMany();

    businessCampaignActivities.forEach((item) => {
      if (dataMap.has(item.date)) {
        dataMap.get(item.date).activities += parseInt(item.count, 10);
      }
    });

    // 6. Activities: Campaigns Created by Business (Direct Campaign creation)
    // We check for campaigns where business_id is NOT NULL
    const directCampaignActivities = await this.campaignRepository
      .createQueryBuilder('c')
      .select("TO_CHAR(c.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.created_at BETWEEN :start AND :end', {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .andWhere('c.business_id IS NOT NULL')
      .groupBy("TO_CHAR(c.created_at, 'YYYY-MM-DD')")
      .getRawMany();

    directCampaignActivities.forEach((item) => {
      if (dataMap.has(item.date)) {
        dataMap.get(item.date).activities += parseInt(item.count, 10);
      }
    });

    // Prepare final arrays
    labels.forEach((date) => {
      const data = dataMap.get(date);
      registrations.push(data.registrations);
      activities.push(data.activities);
    });

    return {
      labels,
      registrations,
      activities,
    };
  }
}
