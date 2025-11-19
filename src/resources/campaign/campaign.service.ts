import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
} from 'typeorm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { BusinessReward } from '../rewards/entities/business-reward.entity';
import { BusinessCampaign } from './entities/business-campaign.entity';
import { Admin } from '../admin/entities/admin.entity';
import { Role } from '../../common/role.enum';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { CampaignAnalyticsQueryDto } from './dto/campaign-analytics-query.dto';
import { User } from 'src/common/interfaces/user.interface';
import { CreateCampaignAdminDto } from './dto/create-campaign-admin.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto | CreateCampaignAdminDto,
    currentUser: Business | Admin,
  ): Promise<Campaign> {
    const campaignData = { ...createCampaignDto };
    const campaign = this.campaignRepository.create(campaignData);
    let rewards: Reward[] = [];

    if (currentUser.role === Role.Admin) {
      const { business_id, reward_ids } =
        createCampaignDto as CreateCampaignAdminDto;
      if (business_id) {
        const business = await this.businessRepository.findOneBy({
          id: business_id,
        });
        if (!business) {
          throw new NotFoundException('Business not found');
        }
        campaign.business = business;
      }

      if (reward_ids) {
        rewards = await this.rewardRepository.findBy({
          id: In(reward_ids),
        });
      }
    } else {
      campaign.business = currentUser as Business;
      campaign.uniqueCode = nanoid(9);
      const { business_reward_ids } = createCampaignDto as CreateCampaignDto;
      if (business_reward_ids) {
        const businessRewards = await this.businessRewardRepository.find({
          where: { id: In(business_reward_ids) },
          relations: ['reward'],
        });
        rewards = businessRewards.map((br) => br.reward);
      }
    }
    campaign.rewards = rewards;
    return this.campaignRepository.save(campaign);
  }

  async findAll(
    currentUser: Business | Admin,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (currentUser.role === Role.Business) {
      where = { business: { id: currentUser.id } };
    }

    const [data, total] = await this.campaignRepository.findAndCount({
      where,
      relations: ['business', 'rewards'],
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findClaimableCampaigns(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.business_id IS NULL')
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM business_campaigns bc WHERE bc.campaign_id = campaign.id AND bc.business_id = :businessId)',
        { businessId },
      )
      .orderBy('campaign.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findAllByBusiness(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['business', 'rewards'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findAllByAdmin(paginationDto: PaginationDto): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: { business: IsNull() },
      relations: ['business', 'rewards'],
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, currentUser: Business | Admin): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['business', 'rewards'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (
      currentUser.role === Role.Business &&
      campaign.business.id !== currentUser.id
    ) {
      throw new UnauthorizedException();
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    currentUser: Business | Admin,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id, currentUser);
    const { reward_ids, business_reward_ids, ...campaignData } =
      updateCampaignDto;
    let rewards: Reward[] = [];

    if (currentUser.role === Role.Admin) {
      if (reward_ids) {
        rewards = await this.rewardRepository.findBy({
          id: In(reward_ids),
        });
      }
    } else {
      if (business_reward_ids) {
        const businessRewards = await this.businessRewardRepository.find({
          where: { id: In(business_reward_ids) },
          relations: ['reward'],
        });
        rewards = businessRewards.map((br) => br.reward);
      }
    }

    campaign.rewards = rewards;
    Object.assign(campaign, campaignData);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string, currentUser: Business | Admin): Promise<void> {
    const campaign = await this.findOne(id, currentUser);
    await this.campaignRepository.remove(campaign);
  }

  async findOngoingCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return this.campaignRepository.find({
      where: {
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
        disabled: false,
      },
    });
  }

  async toggleCampaignStatus(
    id: string,
    currentUser: Business | Admin,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id, currentUser);
    campaign.disabled = !campaign.disabled;
    return this.campaignRepository.save(campaign);
  }

  async findAllPublic(query: any): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: { disabled: false },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAnalytics(currentUser: User, query: CampaignAnalyticsQueryDto) {
    const { campaignId } = query;
    const businessId = currentUser.id;

    const qb = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .leftJoin('ph.campaign', 'c')
      .where('c.business_id = :businessId', { businessId });

    if (campaignId) {
      qb.andWhere('c.id = :campaignId', { campaignId });
    }

    const pointHistories = await qb.getMany();

    const totalPointsEarned = pointHistories.reduce(
      (acc, ph) => acc + ph.points,
      0,
    );
    const totalActivities = pointHistories.length;

    const participantIds = [
      ...new Set(pointHistories.map((ph) => ph.participant.id)),
    ];
    const participants = await this.participantRepository.findBy({
      id: In(participantIds),
    });

    return {
      totalPointsEarned,
      totalActivities,
      participants,
    };
  }

  async claimCampaign(
    businessId: string,
    campaignId: string,
  ): Promise<BusinessCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, business: IsNull() },
    });

    if (!campaign) {
      throw new NotFoundException(
        'Campaign not found or not claimable by business',
      );
    }

    const existingClaim = await this.businessCampaignRepository.findOne({
      where: {
        business: { id: businessId },
        campaign: { id: campaignId },
      },
    });

    if (existingClaim) {
      throw new UnauthorizedException('Campaign already claimed');
    }

    const business = await this.businessRepository.findOneBy({
      id: businessId,
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const businessCampaign = this.businessCampaignRepository.create({
      business,
      campaign,
      uniqueCode: nanoid(9),
    });

    return this.businessCampaignRepository.save(businessCampaign);
  }

  async findClaimedCampaigns(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.businessCampaignRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['campaign'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: data.map((bc) => bc.campaign),
      total,
      page,
      limit,
    };
  }

  async getCampaignAnalytics(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.business', 'business')
      .leftJoin('business.sector', 'sector')
      .leftJoin('campaign.businessCampaigns', 'bc', 'bc.business_id = :businessId', {
        businessId,
      })
      .where('business.id = :businessId OR bc.id IS NOT NULL', { businessId })
      .select([
        'campaign.id',
        'campaign.name',
        'campaign.start_date',
        'campaign.end_date',
        'campaign.disabled',
        'sector.name AS sector',
      ])
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(DISTINCT ph.participant_id)')
            .from(PointHistory, 'ph')
            .where('ph.campaign_id = campaign.id')
            .andWhere('ph.business_id = :businessId', { businessId }),
        'total_participants',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('SUM(ph.points)')
            .from(PointHistory, 'ph')
            .where('ph.campaign_id = campaign.id')
            .andWhere('ph.business_id = :businessId', { businessId })
            .andWhere("ph.type = 'EARN'"),
        'total_points_awarded',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(ph.id)')
            .from(PointHistory, 'ph')
            .where('ph.campaign_id = campaign.id')
            .andWhere('ph.business_id = :businessId', { businessId })
            .andWhere("ph.type = 'REDEEM'"),
        'total_rewards_redeemed',
      )
      .orderBy('campaign.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    const result = data.map((campaign: any) => ({
      ...campaign,
      status: campaign.disabled ? 'inactive' : 'active',
      redemption_rate:
        campaign.total_participants > 0
          ? (campaign.total_rewards_redeemed / campaign.total_participants) * 100
          : 0,
    }));

    return {
      data: result,
      total,
      page,
      limit,
    };
  }

  async getDetailedCampaignAnalytics(
    businessId: string,
    campaignId: string,
  ): Promise<any> {
    const analyticsQuery = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .where('ph.campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .select([
        'COUNT(DISTINCT ph.participant_id) AS total_participants',
        'COUNT(CASE WHEN ph.type = \'REDEEM\' THEN 1 END) AS total_rewards_redeemed',
        'SUM(CASE WHEN ph.type = \'EARN\' THEN ph.points ELSE 0 END) AS total_points_awarded',
      ])
      .getRawOne();

    const weeklyChartDataQuery = this.pointHistoryRepository.query(
      `
      SELECT
        date_trunc('day', ph.created_at) AS date,
        SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS points_awarded,
        COUNT(CASE WHEN ph.type = 'REDEEM' THEN 1 END) AS rewards_redeemed,
        COUNT(DISTINCT CASE WHEN ph.created_at >= NOW() - INTERVAL '7 days' THEN ph.participant_id END) AS new_participants
      FROM
        point_histories ph
      WHERE
        ph.campaign_id = $1
        AND ph.business_id = $2
        AND ph.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY
        date
      ORDER BY
        date;
    `,
      [campaignId, businessId],
    );

    const rankedParticipantsQuery = this.participantRepository
      .createQueryBuilder('p')
      .leftJoin('p.pointHistories', 'ph')
      .where('ph.campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .select([
        'p.id',
        'p.name',
        'p.email',
        'SUM(CASE WHEN ph.type = \'EARN\' THEN ph.points ELSE 0 END) AS total_points_earned',
        'COUNT(CASE WHEN ph.type = \'REDEEM\' THEN 1 END) AS total_redemptions',
      ])
      .groupBy('p.id')
      .orderBy('total_redemptions', 'DESC')
      .getRawMany();

    const topRewardsQuery = this.rewardRepository
      .createQueryBuilder('r')
      .leftJoin('r.pointHistories', 'ph')
      .where('ph.campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .andWhere("ph.type = 'REDEEM'")
      .select([
        'r.id',
        'r.title',
        'r.points_required',
        'COUNT(ph.id) AS total_redemptions',
      ])
      .groupBy('r.id')
      .orderBy('total_redemptions', 'DESC')
      .getRawMany();

    const [analytics, weeklyChartData, rankedParticipants, topRewards] =
      await Promise.all([
        analyticsQuery,
        weeklyChartDataQuery,
        rankedParticipantsQuery,
        topRewardsQuery,
      ]);

    const redemptionRate =
      analytics.total_participants > 0
        ? (analytics.total_rewards_redeemed / analytics.total_participants) *
          100
        : 0;

    return {
      ...analytics,
      redemption_rate: redemptionRate,
      weekly_chart_data: weeklyChartData,
      ranked_participants: rankedParticipants,
      top_rewards: topRewards,
    };
  }
}
