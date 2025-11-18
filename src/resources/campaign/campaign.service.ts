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
import { Admin } from '../admin/entities/admin.entity';
import { Role } from '../../common/role.enum';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { CampaignAnalyticsQueryDto } from './dto/campaign-analytics-query.dto';
import { User } from 'src/common/interfaces/user.interface';
import { CreateCampaignAdminDto } from './dto/create-campaign-admin.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CampaignAnalyticsDto } from './dto/campaign-analytics.dto';
import { CampaignDetailedAnalyticsQueryDto, DateRange } from './dto/campaign-detailed-analytics-query.dto';
import { CampaignDetailedAnalyticsDto } from './dto/campaign-detailed-analytics.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto | CreateCampaignAdminDto,
    currentUser: Business | Admin,
  ): Promise<Campaign> {
    const { reward_ids, ...campaignData } = createCampaignDto;
    const rewards = await this.rewardRepository.findBy({ id: In(reward_ids) });

    const campaign = this.campaignRepository.create({
      ...campaignData,
      rewards,
    });

    if (currentUser.role === Role.Admin) {
      const { business_id } = createCampaignDto as CreateCampaignAdminDto;
      if (business_id) {
        const business = await this.businessRepository.findOneBy({
          id: business_id,
        });
        if (!business) {
          throw new NotFoundException('Business not found');
        }
        campaign.business = business;
      }
    } else {
      campaign.business = currentUser as Business;
    }

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

  async findAllByBusiness(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<any> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: { business: { id: businessId } },
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
    const { reward_ids, ...campaignData } = updateCampaignDto;

    if (reward_ids) {
      campaign.rewards = await this.rewardRepository.findBy({
        id: In(reward_ids),
      });
    }

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

  async getAnalytics(
    currentUser: User,
    query: CampaignAnalyticsQueryDto,
  ): Promise<{
    data: CampaignAnalyticsDto[];
    total: number;
    page: number;
    limit: number;
    next_page: number | null;
  }> {
    const { page = 1, limit = 10 } = query;
    const businessId = currentUser.id;

    const [campaigns, total] = await this.campaignRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['business', 'business.sector'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    if (campaigns.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        next_page: null,
      };
    }

    const campaignIds = campaigns.map((c) => c.id);

    const pointHistories = await this.pointHistoryRepository.find({
      where: { campaign: { id: In(campaignIds) } },
      relations: ['participant', 'campaign'],
    });

    const analyticsData = campaigns.map((campaign) => {
      const histories = pointHistories.filter(
        (ph) => ph.campaign.id === campaign.id,
      );

      const total_participants = new Set(
        histories.map((h) => h.participant.id),
      ).size;
      const total_reward_redeemed = histories.filter(
        (h) => h.type === 'REDEEM',
      ).length;
      const total_point_awarded = histories
        .filter((h) => h.type === 'EARN')
        .reduce((acc, h) => acc + h.points, 0);

      const redemption_rate =
        total_participants > 0
          ? (total_reward_redeemed / total_participants) * 100
          : 0;

      const now = new Date();
      let status = 'Upcoming';
      if (campaign.start_date > now) {
        status = 'Upcoming';
      } else if (campaign.end_date < now) {
        status = 'Ended';
      } else {
        status = 'Active';
      }
      if (campaign.disabled) {
        status = 'Disabled';
      }

      return {
        name: campaign.name,
        sector: campaign.business.sector ? campaign.business.sector.name : 'N/A',
        status,
        total_participants,
        total_reward_redeemed,
        total_point_awarded,
        redemption_rate: parseFloat(redemption_rate.toFixed(2)),
      };
    });

    return {
      data: analyticsData,
      total,
      page,
      limit,
      next_page: total > page * limit ? page + 1 : null,
    };
  }

  async getDetailedAnalytics(
    campaignId: string,
    currentUser: User,
    query: CampaignDetailedAnalyticsQueryDto,
  ): Promise<CampaignDetailedAnalyticsDto> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, business: { id: currentUser.id } },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found or not owned by the user');
    }

    const { range } = query;
    let startDate: Date | undefined;
    const endDate = new Date();

    if (range === DateRange.SevenDays) {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === DateRange.ThirtyDays) {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
    }

    const qb = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .leftJoinAndSelect('ph.participant', 'participant')
      .where('ph.campaign = :campaignId', { campaignId });

    if (startDate) {
      qb.andWhere('ph.created_at >= :startDate', { startDate });
    }

    const pointHistories = await qb.getMany();

    const total_participants = new Set(
      pointHistories.map((h) => h.participant.id),
    ).size;
    const total_points_redeemed = pointHistories
      .filter((h) => h.type === 'REDEEM')
      .reduce((acc, h) => acc + h.points, 0);
    const total_points_awarded = pointHistories
      .filter((h) => h.type === 'EARN')
      .reduce((acc, h) => acc + h.points, 0);
    const total_redemptions = pointHistories.filter(
      (h) => h.type === 'REDEEM',
    ).length;

    const redemption_rate =
      total_participants > 0
        ? (total_redemptions / total_participants) * 100
        : 0;

    const chart_data = this.generateChartData(pointHistories, startDate, endDate);

    return {
      total_participants,
      total_points_redeemed,
      total_points_awarded,
      redemption_rate: parseFloat(redemption_rate.toFixed(2)),
      chart_data,
    };
  }

  private generateChartData(
    pointHistories: PointHistory[],
    startDate: Date | undefined,
    endDate: Date,
  ): any[] {
    const dataMap = new Map<string, any>();
    const participantFirstInteraction = new Map<string, string>();

    const start = startDate ? new Date(startDate) : new Date(Math.min(...pointHistories.map(ph => new Date(ph.created_at).getTime())));
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      dataMap.set(dateString, {
        date: dateString,
        points_awarded: 0,
        redemptions: 0,
        participants_joined: 0,
      });
    }

    pointHistories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    pointHistories.forEach((ph) => {
      const dateString = new Date(ph.created_at).toISOString().split('T')[0];
      if (dataMap.has(dateString)) {
        const dayData = dataMap.get(dateString);
        if (ph.type === 'EARN') {
          dayData.points_awarded += ph.points;
        } else {
          dayData.redemptions += 1;
        }

        if (!participantFirstInteraction.has(ph.participant.id)) {
          participantFirstInteraction.set(ph.participant.id, dateString);
        }
      }
    });

    participantFirstInteraction.forEach((dateString, participantId) => {
      if (dataMap.has(dateString)) {
        dataMap.get(dateString).participants_joined += 1;
      }
    });

    return Array.from(dataMap.values());
  }
}
