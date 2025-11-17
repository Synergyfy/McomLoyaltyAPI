import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { BusinessCampaign } from './entities/business-campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Reward } from '../rewards/entities/reward.entity';

@Injectable()
export class BusinessCampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
  ) {}

  async createCampaign(businessId: string, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const rewards = await this.rewardRepository.findBy({ id: In(createCampaignDto.reward_ids) });
    if (rewards.length !== createCampaignDto.reward_ids.length) {
      throw new BadRequestException('One or more rewards not found');
    }

    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      business,
      rewards,
    });

    return this.campaignRepository.save(campaign);
  }

  async getMyCampaigns(businessId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const [data, total] = await this.campaignRepository.findAndCount({
      where: { business: { id: businessId } },
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      total,
      page,
      limit,
      next_page: total > page * limit ? page + 1 : null,
    };
  }

  async getUnaddedAdminCampaigns(businessId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const addedCampaignIds = await this.businessCampaignRepository
      .createQueryBuilder('bc')
      .select('bc.campaign_id')
      .where('bc.business_id = :businessId', { businessId })
      .getRawMany()
      .then((results) => results.map((r) => r.campaign_id));

    const query = this.campaignRepository
      .createQueryBuilder('c')
      .where('c.business_id IS NULL')
      .orderBy('c.created_at', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (addedCampaignIds.length > 0) {
      query.andWhere('c.id NOT IN (:...addedCampaignIds)', { addedCampaignIds });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      next_page: total > page * limit ? page + 1 : null,
    };
  }

  async addAdminCampaign(businessId: string, campaignId: string): Promise<BusinessCampaign> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId, business: IsNull() } });
    if (!campaign) {
      throw new NotFoundException('Admin campaign not found');
    }

    const existing = await this.businessCampaignRepository.findOne({
      where: { business: { id: businessId }, campaign: { id: campaignId } },
    });

    if (existing) {
      throw new BadRequestException('Campaign already added');
    }

    const businessCampaign = this.businessCampaignRepository.create({
      business,
      campaign,
    });

    return this.businessCampaignRepository.save(businessCampaign);
  }

  async getAddedAdminCampaigns(businessId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const [data, total] = await this.businessCampaignRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['campaign'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: data.map((bc) => bc.campaign),
      total,
      page,
      limit,
      next_page: total > page * limit ? page + 1 : null,
    };
  }
}
