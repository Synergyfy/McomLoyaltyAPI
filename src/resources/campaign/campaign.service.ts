import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Admin } from '../admin/entities/admin.entity';
import { Role } from '../../common/role.enum';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    currentUser: Business | Admin,
  ): Promise<Campaign> {
    const { reward_ids, business_id, ...campaignData } = createCampaignDto;
    const rewards = await this.rewardRepository.findBy({ id: In(reward_ids) });

    let business: Business;
    if (currentUser.role === Role.Admin) {
      business = await this.businessRepository.findOneBy({ id: business_id });
    } else {
      business = await this.businessRepository.findOneBy({
        id: currentUser.id,
      });
    }

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const campaign = this.campaignRepository.create({
      ...campaignData,
      business,
      rewards,
    });

    return this.campaignRepository.save(campaign);
  }

  async findAll(currentUser: Business | Admin): Promise<Campaign[]> {
    if (currentUser.role === Role.Admin) {
      return this.campaignRepository.find({ relations: ['business', 'rewards'] });
    } else {
      return this.campaignRepository.find({
        where: { business: { id: currentUser.id } },
        relations: ['business', 'rewards'],
      });
    }
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
      campaign.rewards = await this.rewardRepository.findBy({ id: In(reward_ids) });
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

  async toggleCampaignStatus(id: string, currentUser: Business | Admin): Promise<Campaign> {
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
}