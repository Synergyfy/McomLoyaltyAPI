import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Campaign } from '../campaign/entities/campaign.entity';
import { PointHistory, PointHistoryType } from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { GeneralAnalyticsDto } from './dto/general-analytics.dto';
import { User } from 'src/common/interfaces/user.interface';
import { ChartResponseDto, ChartData } from './dto/chart-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  async getGeneralAnalytics(user: User): Promise<GeneralAnalyticsDto> {
    const businessId = user.id;
    const now = new Date();

    const campaigns = await this.campaignRepository.find({
      where: { business: { id: businessId } },
      relations: ['participants'],
    });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(
      (c) => !c.disabled && new Date(c.start_date) <= now && new Date(c.end_date) >= now,
    );
    const totalActiveCampaigns = activeCampaigns.length;

    const campaignIds = campaigns.map((c) => c.id);

    let totalCustomers = 0;
    if (campaignIds.length > 0) {
        const uniqueParticipants = new Set<string>();
        campaigns.forEach(campaign => {
            campaign.participants.forEach(participant => {
                uniqueParticipants.add(participant.id);
            });
        });
        totalCustomers = uniqueParticipants.size;
    }


    const totalPointsEarned = campaigns.reduce(
      (sum, c) => sum + c.total_points_earned,
      0,
    );
    const totalPointsRedeemed = campaigns.reduce(
      (sum, c) => sum + c.total_points_redeemed,
      0,
    );

    const totalRewardsRedeemed = await this.pointHistoryRepository.count({
        where: {
            campaign: { id: In(campaignIds) },
            type: PointHistoryType.REDEEM,
        }
    });

    const activeCampaignsWithCustomerCounts = activeCampaigns.map(
      (campaign) => ({
        name: campaign.name,
        customerCount: campaign.participants.length,
      }),
    );

    const lastTenActivities = await this.pointHistoryRepository.find({
      where: { campaign: { id: In(campaignIds) } },
      order: { created_at: 'DESC' },
      take: 10,
      relations: ['participant', 'campaign'],
    });

    return {
      totalCustomers,
      totalCampaigns,
      totalActiveCampaigns,
      totalRewardsRedeemed,
      totalPointsEarned,
      totalPointsRedeemed,
      activeCampaigns: activeCampaignsWithCustomerCounts,
      lastTenActivities,
    };
  }

  async getChartAnalytics(user: User, period: string): Promise<ChartResponseDto> {
    const businessId = user.id;
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3m':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6m':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const campaigns = await this.campaignRepository.find({
      where: { business: { id: businessId } },
    });
    const campaignIds = campaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return { data: [] };
    }

    const earnedPoints = await this.pointHistoryRepository
      .createQueryBuilder('ph')
      .select("DATE(ph.created_at) as date, SUM(ph.points) as points")
      .where('ph.campaignId IN (:...campaignIds)', { campaignIds })
      .andWhere('ph.type = :type', { type: PointHistoryType.EARN })
      .andWhere('ph.created_at >= :startDate', { startDate })
      .groupBy('DATE(ph.created_at)')
      .orderBy('DATE(ph.created_at)', 'ASC')
      .getRawMany();

    const redeemedPoints = await this.pointHistoryRepository
      .createQueryBuilder('ph')
      .select("DATE(ph.created_at) as date, SUM(ph.points) as points")
      .where('ph.campaignId IN (:...campaignIds)', { campaignIds })
      .andWhere('ph.type = :type', { type: PointHistoryType.REDEEM })
      .andWhere('ph.created_at >= :startDate', { startDate })
      .groupBy('DATE(ph.created_at)')
      .orderBy('DATE(ph.created_at)', 'ASC')
      .getRawMany();

    const data: { [key: string]: ChartData } = {};

    earnedPoints.forEach(row => {
        const date = new Date(row.date).toISOString().split('T')[0];
        if (!data[date]) {
            data[date] = { date, pointsEarned: 0, pointsRedeemed: 0 };
        }
        data[date].pointsEarned = parseInt(row.points, 10);
    });

    redeemedPoints.forEach(row => {
        const date = new Date(row.date).toISOString().split('T')[0];
        if (!data[date]) {
            data[date] = { date, pointsEarned: 0, pointsRedeemed: 0 };
        }
        data[date].pointsRedeemed = parseInt(row.points, 10);
    });

    return { data: Object.values(data) };
  }
}
