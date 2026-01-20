import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, In, Repository } from "typeorm";
import moment from "moment";

import { Business } from "../../business/entities/business.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { Participant } from "../../participant/entities/participant.entity";
import {
  PointHistory,
  PointHistoryType,
} from "../../participant-campaign-balance/entities/point-history.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import {
  SystemOverviewDto,
  TopBusinessDto,
  TopRewardDto,
} from "../dto/admin_analytics.dto";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { ParticipantCampaignBalance } from "../../participant-campaign-balance/entities/participant-campaign-balance.entity";
import {
  GrowthActivityChartDto,
  GrowthActivityResponseDto,
} from "../dto/growth-activity-chart.dto";
import { PointLogResponseDto, PointLogItemDto } from "../dto/point-log.dto";
import { PointLogFilterDto } from "../dto/point-log-filter.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";

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
    const { totalBusinessMatchingPoints } = await this.businessRepository
      .createQueryBuilder("business")
      .select("SUM(business.matching_points)", "totalBusinessMatchingPoints")
      .getRawOne();

    const { totalParticipantMatchingPoints } = await this.participantRepository
      .createQueryBuilder("participant")
      .select(
        "SUM(participant.matching_points)",
        "totalParticipantMatchingPoints",
      )
      .getRawOne();

    const totalMatchingPoints =
      (parseInt(totalBusinessMatchingPoints, 10) || 0) +
      (parseInt(totalParticipantMatchingPoints, 10) || 0);

    return {
      totalCampaigns,
      totalParticipants,
      totalRedemptions,
      totalBusiness,
      totalMatchingPoints,
    };
  }

  /**
   * Retrieves the top 10 performing businesses based on the sum of points earned and redeemed in their campaigns.
   * @returns A promise that resolves to a list of the top 10 businesses.
   */
  async getTopBusinesses(): Promise<TopBusinessDto[]> {
    const topBusinesses = await this.businessRepository
      .createQueryBuilder("business")
      .select("business.id", "id")
      .addSelect("business.name", "name")
      .addSelect("business.total_points_earned", "totalPointsEarned")
      .addSelect("business.total_points_redeemed", "totalPointsRedeemed")
      .orderBy(
        "business.total_points_earned + business.total_points_redeemed",
        "DESC",
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
      .createQueryBuilder("ph")
      .select("reward.id", "id")
      .addSelect("reward.title", "name")
      .addSelect("COUNT(ph.id)", "totalRedemptions")
      .innerJoin("ph.reward", "reward")
      .where("ph.type = :type", { type: PointHistoryType.REDEEM })
      .groupBy("reward.id, reward.title")
      .orderBy('"totalRedemptions"', "DESC")
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
      ? moment(dto.startDate).startOf("day")
      : moment().subtract(30, "days").startOf("day");
    const endDate = dto.endDate
      ? moment(dto.endDate).endOf("day")
      : moment().endOf("day");

    const days = endDate.diff(startDate, "days") + 1;
    const labels: string[] = [];
    const registrations: number[] = [];
    const activities: number[] = [];

    // Initialize map for aggregation
    const dataMap = new Map<
      string,
      { registrations: number; activities: number }
    >();

    for (let i = 0; i < days; i++) {
      const date = startDate.clone().add(i, "days").format("YYYY-MM-DD");
      labels.push(date);
      dataMap.set(date, { registrations: 0, activities: 0 });
    }

    // 1. Registrations: Businesses
    const newBusinesses = await this.businessRepository
      .createQueryBuilder("business")
      .select("TO_CHAR(business.created_at, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(business.id)", "count")
      .where("business.created_at BETWEEN :start AND :end", {
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
      .createQueryBuilder("participant")
      .select("TO_CHAR(participant.created_at, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(participant.id)", "count")
      .where("participant.created_at BETWEEN :start AND :end", {
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
      .createQueryBuilder("ph")
      .select("TO_CHAR(ph.created_at, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(ph.id)", "count")
      .where("ph.created_at BETWEEN :start AND :end", {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .andWhere("ph.type IN (:...types)", {
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
      .createQueryBuilder("pcb")
      .select("TO_CHAR(pcb.created_at, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(pcb.id)", "count")
      .where("pcb.created_at BETWEEN :start AND :end", {
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
      .createQueryBuilder("bc")
      .select("TO_CHAR(bc.created_at, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(bc.id)", "count")
      .where("bc.created_at BETWEEN :start AND :end", {
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
      .createQueryBuilder("c")
      .select("TO_CHAR(c.created_at, 'YYYY-MM-DD')", "date")
      .addSelect("COUNT(c.id)", "count")
      .where("c.created_at BETWEEN :start AND :end", {
        start: startDate.toDate(),
        end: endDate.toDate(),
      })
      .andWhere("c.business_id IS NOT NULL")
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

  /**
   * Retrieves a paginated log of point transactions (earnings and redemptions).
   * @param paginationDto The pagination options.
   * @returns A promise that resolves to a paginated list of point logs.
   */
  async getPointLogs(
    filterDto: PointLogFilterDto,
  ): Promise<PointLogResponseDto> {
    const {
      page,
      limit,
      businessId,
      campaignId,
      participantId,
      transactionType,
      startDate,
      endDate,
    } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .leftJoin("ph.participant", "participant")
      .select([
        "ph.id",
        "ph.points",
        "ph.type",
        "ph.created_at",
        "participant.name",
        "participant.email",
      ])
      .orderBy("ph.created_at", "DESC")
      .skip(skip)
      .take(limit);

    if (businessId) {
      queryBuilder.andWhere("ph.business_id = :businessId", { businessId });
    }

    if (campaignId) {
      queryBuilder.andWhere("ph.campaign_id = :campaignId", { campaignId });
    }

    if (participantId) {
      queryBuilder.andWhere("ph.participant_id = :participantId", {
        participantId,
      });
    }

    if (transactionType) {
      queryBuilder.andWhere("ph.type = :transactionType", { transactionType });
    }

    if (startDate) {
      queryBuilder.andWhere("ph.created_at >= :startDate", {
        startDate: moment(startDate).startOf("day").toDate(),
      });
    }

    if (endDate) {
      queryBuilder.andWhere("ph.created_at <= :endDate", {
        endDate: moment(endDate).endOf("day").toDate(),
      });
    }

    const [results, total] = await queryBuilder.getManyAndCount();

    const data: PointLogItemDto[] = results.map((log) => {
      const description = log.type.toString();
      const type = "Regular";

      return {
        name: log.participant ? log.participant.name : "Unknown",
        email: log.participant ? log.participant.email : "Unknown",
        points: log.points,
        description: description,
        type: type,
        date: log.created_at,
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
