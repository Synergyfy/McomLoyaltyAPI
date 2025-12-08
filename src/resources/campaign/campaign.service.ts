import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Not,
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
import {
  PointHistory,
  PointHistoryType,
} from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Staff } from '../staff/entities/staff.entity';
import { CampaignAnalyticsQueryDto } from './dto/campaign-analytics-query.dto';
import { User } from 'src/common/interfaces/user.interface';
import { CreateCampaignAdminDto } from './dto/create-campaign-admin.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { nanoid } from 'nanoid';
import { MatchingPointService } from '../matching-point/services/matching-point.service';
import { MatchingPointActivityType } from '../matching-point/entities/matching-point-config.entity';
import { PaginatedCustomerActivityResponseDto } from './dto/customer-activity-response.dto';
import { PaginatedCampaignResponseDto } from './dto/paginated-campaign-response.dto';

import { WishlistAggregate } from '../wishlist/entities/wishlist-aggregate.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';
import { MailService } from 'src/mail/mail.service';
import { CreateCampaignFromWishlistDto } from './dto/create-campaign-from-wishlist.dto';
import { Tier } from '../tier/entities/tier.entity';
import { TierProgressionService } from '../tier-progression/tier-progression.service';
import { CapabilityService, ActionType } from '../capability/capability.service';

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
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(WishlistAggregate)
    private readonly wishlistAggregateRepository: Repository<WishlistAggregate>,
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => TierProgressionService))
    private readonly tierProgressionService: TierProgressionService,
    @Inject(forwardRef(() => CapabilityService))
    private readonly capabilityService: CapabilityService,
    private readonly matchingPointService: MatchingPointService,
  ) { }

  async create(
    createCampaignDto: CreateCampaignDto | CreateCampaignAdminDto,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    const campaignData = { ...createCampaignDto };
    let rewards: Reward[] = [];

    if (currentUser.role === Role.Admin) {
      const campaign = this.campaignRepository.create(campaignData);
      const { business_id, reward_ids, target_tier_id } =
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

      if (target_tier_id) {
        const tier = await this.tierRepository.findOneBy({ id: target_tier_id });
        if (!tier) {
          throw new NotFoundException('Target tier not found');
        }

        const maxRewards = tier.configuration?.quotas?.maxRewardsPerCampaign;
        // If maxRewards is -1, it's unlimited. If it's defined and not -1, check limit.
        if (maxRewards !== undefined && maxRewards !== -1) {
          if (rewards.length > maxRewards) {
            throw new BadRequestException(
              `Target tier '${tier.name}' allows a maximum of ${maxRewards} rewards per campaign. You selected ${rewards.length}.`,
            );
          }
        }
        campaign.targetTier = tier;
      }

      campaign.rewards = rewards;
      return this.campaignRepository.save(campaign);
    } else {
      // Business creating a campaign -> BusinessCampaign
      const businessCampaign = this.businessCampaignRepository.create(campaignData);
      businessCampaign.business = currentUser as Business;
      businessCampaign.uniqueCode = nanoid(9);
      const { business_reward_ids } = createCampaignDto as CreateCampaignDto;

      if (!business_reward_ids || business_reward_ids.length === 0) {
        throw new BadRequestException('Business must add at least one reward to the campaign.');
      }

      // Check tier permission for reward count
      await this.capabilityService.checkPermission(currentUser.id, ActionType.CREATE_CAMPAIGN, {
        isFromScratch: true,
        rewardCount: business_reward_ids.length,
      });

      if (business_reward_ids && business_reward_ids.length > 0) {
        const businessRewards = await this.businessRewardRepository.find({
          where: { id: In(business_reward_ids) },
          relations: ['reward', 'business'],
        });

        // Validate that all found rewards belong to the current business
        for (const reward of businessRewards) {
          if (reward.business.id !== currentUser.id) {
            throw new UnauthorizedException(`Business Reward with ID ${reward.id} does not belong to your business.`);
          }
        }

        // Also check if all requested IDs were found (optional but good practice)
        if (businessRewards.length !== business_reward_ids.length) {
          throw new BadRequestException('One or more business rewards not found.');
        }

        businessCampaign.businessRewards = businessRewards;
      }
      // businessCampaign.rewards = rewards; // Removed setting rewards
      const savedCampaign = await this.businessCampaignRepository.save(businessCampaign);

      // Check for promotion
      await this.tierProgressionService.checkAndPromote(currentUser.id);

      // Award matching points
      await this.matchingPointService.addPoints(
        currentUser.id,
        MatchingPointActivityType.CAMPAIGN_CREATION,
        `Campaign Created: ${savedCampaign.name}`,
      );

      return savedCampaign;
    }
  }

  async createFromWishlist(
    createCampaignDto: CreateCampaignFromWishlistDto,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    const { wishlistAggregateId, ...campaignData } = createCampaignDto;

    const wishlistAggregate = await this.wishlistAggregateRepository.findOne({
      where: { id: wishlistAggregateId },
      relations: ['category'],
    });

    if (!wishlistAggregate) {
      throw new NotFoundException('Wishlist aggregate not found');
    }

    // Find all participants who have this item in their wishlist
    const wishlistItems = await this.wishlistItemRepository.find({
      where: {
        itemName: wishlistAggregate.itemName,
        category: { id: wishlistAggregate.category.id },
        marketingConsent: true,
      },
      relations: ['participant'],
    });

    const participants = wishlistItems
      .map((item) => item.participant)
      .filter(
        (participant, index, self) =>
          index === self.findIndex((p) => p.id === participant.id),
      );

    const initialAudienceSize = participants.length;

    let createdCampaign: Campaign | BusinessCampaign;

    if (currentUser.role === Role.Admin) {
      const campaign = this.campaignRepository.create({
        ...campaignData,
        wishlistAggregate,
        initial_audience_size: initialAudienceSize,
      });

      const { reward_ids } = createCampaignDto;

      // If business_id was removed, we might want to infer it or leave it null.
      // For now, removing the explicit assignment from DTO as requested.

      if (reward_ids) {
        const rewards = await this.rewardRepository.findBy({
          id: In(reward_ids),
        });
        campaign.rewards = rewards;
      }

      createdCampaign = await this.campaignRepository.save(campaign);
    } else {
      const businessCampaign = this.businessCampaignRepository.create({
        ...campaignData,
        wishlistAggregate,
        initial_audience_size: initialAudienceSize,
      });
      businessCampaign.business = currentUser as Business;
      businessCampaign.uniqueCode = nanoid(9);

      const { business_reward_ids } = createCampaignDto;
      if (business_reward_ids) {
        const businessRewards = await this.businessRewardRepository.find({
          where: { id: In(business_reward_ids) },
          relations: ['reward'],
        });
        businessCampaign.rewards = businessRewards.map((br) => br.reward);
      }

      createdCampaign = await this.businessCampaignRepository.save(businessCampaign);

      // Check for promotion
      await this.tierProgressionService.checkAndPromote(currentUser.id);
    }

    // Send emails to participants
    const businessName =
      currentUser.role === Role.Business
        ? (currentUser as Business).name
        : (createdCampaign as Campaign).business?.name || 'Mcom Loyalty';

    // Assuming we have a way to generate a deep link or URL to the campaign
    // For now, we'll just point to a generic campaign page or the app
    const ctaLink = `https://mcomloyalty.vercel.app/campaigns/${createdCampaign.id}`; // Replace with actual deep link logic

    for (const participant of participants) {
      if (participant.email) {
        await this.mailService.sendWishlistCampaignEmail(
          participant.email,
          createdCampaign.name,
          businessName,
          wishlistAggregate.itemName,
          ctaLink,
        );
      }
    }

    return createdCampaign;
  }

  async findAll(
    currentUser: Business | Admin,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    if (currentUser.role === Role.Business) {
      const [data, total] = await this.businessCampaignRepository.findAndCount({
        where: { business: { id: currentUser.id } },
        relations: ['business', 'rewards'],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);
      const next = page < totalPages ? Number(page) + 1 : null;
      const previous = page > 1 ? Number(page) - 1 : null;

      return {
        data: data as any,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        next,
        previous,
      };
    } else {
      const [data, total] = await this.campaignRepository.findAndCount({
        relations: ['business', 'rewards'],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);
      const next = page < totalPages ? Number(page) + 1 : null;
      const previous = page > 1 ? Number(page) - 1 : null;

      return {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        next,
        previous,
      };
    }
  }

  async findClaimableCampaigns(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
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

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findAllByBusiness(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.businessCampaignRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['business', 'rewards'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data: data as any,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findAllByAdmin(
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: { business: IsNull() },
      relations: ['business', 'rewards'],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findAllByOtherAdmins(
    currentUser: Admin,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: {
        business: IsNull(),
      },
      relations: ['business', 'rewards'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findOne(id: string, currentUser?: User): Promise<Campaign | BusinessCampaign> {
    const businessCampaign = await this.businessCampaignRepository.findOne({
      where: { id },
      relations: ['business', 'rewards', 'campaign', 'businessRewards'],
    });

    if (businessCampaign) {
      if (!currentUser) {
        return businessCampaign;
      }
      if (currentUser.role === Role.Business && businessCampaign.business.id !== currentUser.id) {
        throw new UnauthorizedException();
      }
      if (currentUser.role === Role.Staff) {
        const staff = await this.staffRepository.findOne({
          where: { id: currentUser.id },
          relations: ['business'],
        });
        if (!staff || !staff.business || staff.business.id !== businessCampaign.business.id) {
          throw new UnauthorizedException();
        }
      }
      return businessCampaign;
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['business', 'rewards'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // If public (no user), allow access
    if (!currentUser) {
      return campaign;
    }

    // If Business, check ownership
    if (
      currentUser.role === Role.Business &&
      campaign.business?.id !== currentUser.id
    ) {
      throw new UnauthorizedException();
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    const campaign = await this.findOne(id, currentUser);
    const { reward_ids, business_reward_ids, ...campaignData } = updateCampaignDto;
    let rewards: Reward[] = [];

    if (currentUser.role === Role.Admin) {
      // Admin updating Campaign
      if (campaign instanceof Campaign) {
        if (reward_ids) {
          rewards = await this.rewardRepository.findBy({
            id: In(reward_ids),
          });
          campaign.rewards = rewards;
        }
      }
    } else {
      // Business updating BusinessCampaign
      if (campaign instanceof BusinessCampaign) {
        // Check if claimed (Template)
        if (campaign.campaign) {
          await this.capabilityService.checkPermission(currentUser.id, ActionType.EDIT_TEMPLATE);

          if (business_reward_ids && business_reward_ids.length > 0) {
            throw new BadRequestException('Cannot add business rewards to a claimed campaign template.');
          }

          if (reward_ids) {
            const newRewards = await this.rewardRepository.findBy({
              id: In(reward_ids),
            });
            campaign.rewards = newRewards;
          }
        } else {
          // Created from Scratch
          if (reward_ids && reward_ids.length > 0) {
            throw new BadRequestException('Cannot add admin rewards to a custom business campaign.');
          }

          if (business_reward_ids) {
            const businessRewards = await this.businessRewardRepository.find({
              where: { id: In(business_reward_ids) },
              relations: ['reward'],
            });
            campaign.businessRewards = businessRewards;
          }
        }

        // Validation: Ensure at least one type of reward is present
        const hasRewards = campaign.rewards && campaign.rewards.length > 0;
        const hasBusinessRewards = campaign.businessRewards && campaign.businessRewards.length > 0;

        if (!hasRewards && !hasBusinessRewards) {
          // Only throw if we actually modified something that resulted in empty rewards?
          // Or always enforce?
          // If it's an existing campaign, it should have rewards.
          // If we are not updating rewards, hasRewards/hasBusinessRewards will reflect DB state (loaded in findOne).
          // So this check is safe.
          throw new BadRequestException('Campaign must have at least one reward.');
        }

        if (hasRewards && hasBusinessRewards) {
          throw new BadRequestException('Campaign cannot have both admin rewards and business rewards.');
        }
      }
    }

    Object.assign(campaign, campaignData);

    if (campaign instanceof BusinessCampaign) {
      return this.businessCampaignRepository.save(campaign);
    } else {
      return this.campaignRepository.save(campaign);
    }
  }

  async remove(id: string, currentUser: Business | Admin): Promise<void> {
    const campaign = await this.findOne(id, currentUser);
    if (campaign instanceof BusinessCampaign) {
      await this.businessCampaignRepository.remove(campaign);
    } else {
      await this.campaignRepository.remove(campaign);
    }
  }

  async findOngoingCampaigns(): Promise<BusinessCampaign[]> {
    const now = new Date();
    return this.businessCampaignRepository.find({
      where: {
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
        disabled: false,
      },
      relations: ['business'],
    });
  }

  async findOngoingForStaff(
    currentUser: User,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    let businessId: string;

    if (currentUser.role === Role.Business) {
      businessId = currentUser.id;
    } else {
      const staff = await this.staffRepository.findOne({
        where: { id: currentUser.id },
        relations: ['business'],
      });

      if (!staff || !staff.business) {
        throw new UnauthorizedException(
          'Staff or associated business not found',
        );
      }
      businessId = staff.business.id;
    }

    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    // Query BusinessCampaigns for this business
    const [data, total] = await this.businessCampaignRepository.findAndCount({
      where: {
        business: { id: businessId },
        start_date: LessThanOrEqual(new Date()),
        end_date: MoreThanOrEqual(new Date()),
        disabled: false
      },
      relations: ['business', 'rewards'],
      order: { created_at: 'DESC' },
      skip,
      take: limit
    });

    // We need participant count.
    // Since we can't easily do this with findAndCount and subqueries in one go for mapped entities easily in typeorm without qb,
    // let's use QB or post-process.

    // Let's stick to QB for efficiency
    const qb = this.businessCampaignRepository.createQueryBuilder('bc')
      .leftJoinAndSelect('bc.business', 'business')
      .leftJoinAndSelect('bc.rewards', 'rewards')
      .where('bc.business_id = :businessId', { businessId })
      .andWhere('bc.start_date <= NOW()')
      .andWhere('bc.end_date >= NOW()')
      .andWhere('bc.disabled = :disabled', { disabled: false })
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(DISTINCT ph.participant_id)', 'participant_count')
            .from(PointHistory, 'ph')
            .where('ph.business_campaign_id = bc.id'),
        'participantCount',
      )
      .orderBy('bc.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const totalCount = await qb.getCount();
    const { entities, raw } = await qb.getRawAndEntities();

    const result = entities.map((entity) => {
      const rawResult = raw.find((r) => r.bc_id === entity.id);
      const participantCount = rawResult
        ? parseInt(rawResult.participantCount, 10)
        : 0;
      return { ...entity, participantCount };
    });

    const totalPages = Math.ceil(totalCount / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data: result as any,
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findParticipantCampaignsForBusiness(
    currentUser: User,
    query: string,
  ): Promise<Campaign[]> {
    // Return type says Campaign[], but we probably want BusinessCampaign[] if applicable.
    // But we can return mix or just change return type to any[] or (Campaign|BusinessCampaign)[]
    // For now, let's see if we can query BusinessCampaigns

    let businessId: string;

    if (currentUser.role === Role.Business) {
      businessId = currentUser.id;
    } else {
      const staff = await this.staffRepository.findOne({
        where: { id: currentUser.id },
        relations: ['business'],
      });

      if (!staff || !staff.business) {
        throw new UnauthorizedException(
          'Staff or associated business not found',
        );
      }
      businessId = staff.business.id;
    }

    const participant = await this.participantRepository.findOne({
      where: [{ email: query }, { uniqueCode: query }],
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Find BusinessCampaigns where the participant has a balance
    const qb = this.businessCampaignRepository
      .createQueryBuilder('bc')
      .leftJoinAndSelect('bc.rewards', 'rewards')
      .leftJoinAndSelect('bc.business', 'business')
      .innerJoin(
        'bc.participantCampaignBalances',
        'pcb',
        'pcb.participantId = :participantId',
        { participantId: participant.id },
      )
      .where('bc.business_id = :businessId', { businessId })
      .andWhere('bc.disabled = :disabled', { disabled: false });

    return qb.getMany() as any;
  }

  async toggleCampaignStatus(
    id: string,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    const campaign = await this.findOne(id, currentUser);
    campaign.disabled = !campaign.disabled;
    if (campaign instanceof BusinessCampaign) {
      return this.businessCampaignRepository.save(campaign);
    }
    return this.campaignRepository.save(campaign);
  }

  async findAllPublic(query: any): Promise<PaginatedCampaignResponseDto> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.campaignRepository.findAndCount({
      where: { disabled: false },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async getAnalytics(currentUser: User, query: CampaignAnalyticsQueryDto) {
    const { campaignId } = query;
    const businessId = currentUser.id;

    const qb = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .leftJoin('ph.businessCampaign', 'bc') // Changed to businessCampaign
      .where('ph.business_id = :businessId', { businessId });

    if (campaignId) {
      qb.andWhere('bc.id = :campaignId', { campaignId });
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
    businessRewardIds: string[],
  ): Promise<BusinessCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, business: IsNull() },
      relations: ['rewards'],
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

    // Fetch and validate business rewards
    const businessRewards = await this.businessRewardRepository.find({
      where: { id: In(businessRewardIds) },
      relations: ['business', 'reward'],
    });

    if (businessRewards.length !== businessRewardIds.length) {
      throw new BadRequestException('One or more business rewards not found.');
    }

    for (const reward of businessRewards) {
      if (reward.business.id !== businessId) {
        throw new UnauthorizedException(
          `Business Reward with ID ${reward.id} does not belong to your business.`,
        );
      }
    }

    // Optional: Check if the number of rewards exceeds the template's reward count?
    // The user requirement was about tier limits mostly.
    // But if the template has 3 rewards, should the business be allowed to add 5?
    // Usually a template defines the structure. If the template has slots for rewards, maybe we should respect that?
    // The user said "make it such that it is the business adding their own rewards to the campaign".
    // I will stick to tier limits which are enforced by the capability service check in the controller.

    const businessCampaign = this.businessCampaignRepository.create({
      business,
      campaign,
      uniqueCode: nanoid(9),
      name: campaign.name,
      campaign_type: campaign.campaign_type,
      campaign_message: campaign.campaign_message,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      quantity: campaign.quantity,
      audience_type: campaign.audience_type,
      banner_url: campaign.banner_url,
      logo_url: campaign.logo_url,
      cta_text: campaign.cta_text,
      cta_background_color: campaign.cta_background_color,
      cta_text_color: campaign.cta_text_color,
      text_color: campaign.text_color,
      background_color: campaign.background_color,
      signUpPoint: campaign.signUpPoint,
      reward_type: campaign.reward_type,
      regular_points_threshold: campaign.regular_points_threshold,
      matching_points_threshold: campaign.matching_points_threshold,
      matching_points_disabled_by_admin: campaign.matching_points_disabled_by_admin,
      earn_point_page_title: campaign.earn_point_page_title,
      earn_point_page_description: campaign.earn_point_page_description,
      redeem_reward_page_title: campaign.redeem_reward_page_title,
      redeem_reward_page_description: campaign.redeem_reward_page_description,
      contact_us_page_title: campaign.contact_us_page_title,
      contact_us_page_description: campaign.contact_us_page_description,
      contact_email: campaign.contact_email,
      contact_phone_number: campaign.contact_phone_number,
      footer_text: campaign.footer_text,
    });

    // Link business rewards
    businessCampaign.businessRewards = businessRewards;

    return this.businessCampaignRepository.save(businessCampaign);
  }

  async getCampaignAnalytics(campaignId: string, businessId: string) {
    const analyticsQuery = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .where('ph.business_campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .select([
        "SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS total_points_earned",
        "SUM(CASE WHEN ph.type = 'REDEEM' THEN ph.points ELSE 0 END) AS total_points_redeemed",
        "COUNT(CASE WHEN ph.type = 'EARN' THEN 1 END) AS total_earns",
        "COUNT(CASE WHEN ph.type = 'REDEEM' THEN 1 END) AS total_redemptions",
        "COUNT(CASE WHEN ph.type = 'REDEEM' AND ph.reward_id IS NOT NULL THEN 1 END) AS total_rewards_redeemed",
        'COUNT(DISTINCT ph.participant_id) AS total_participants',
      ])
      .getRawOne();

    const weeklyChartDataQuery = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .where('ph.business_campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .andWhere("ph.created_at >= NOW() - INTERVAL '7 days'")
      .select([
        "TO_CHAR(ph.created_at, 'YYYY-MM-DD') AS date",
        "SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS points_earned",
        "SUM(CASE WHEN ph.type = 'REDEEM' THEN ph.points ELSE 0 END) AS points_redeemed",
      ])
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const rankedParticipantsQuery = this.pointHistoryRepository
      .createQueryBuilder('ph')
      .leftJoin('ph.participant', 'p')
      .where('ph.business_campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .select([
        'p.id',
        'p.name',
        'p.email',
        "SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS total_points_earned",
        "COUNT(CASE WHEN ph.type = 'REDEEM' THEN 1 END) AS total_redemptions",
      ])
      .groupBy('p.id')
      .orderBy('total_redemptions', 'DESC')
      .getRawMany();

    const topRewardsQuery = this.rewardRepository
      .createQueryBuilder('r')
      .leftJoin('r.pointHistories', 'ph')
      .where('ph.business_campaign_id = :campaignId', { campaignId })
      .andWhere('ph.business_id = :businessId', { businessId })
      .andWhere("ph.type = 'REDEEM'")
      .select([
        'r.id',
        'r.title',
        'r.max_points',
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

  async getBusinessCustomerActivities(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCustomerActivityResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where: { business: { id: businessId } },
      relations: ['participant', 'reward', 'campaign', 'businessCampaign'], // added businessCampaign
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const activities = data.map((ph) => {
      let details = '';
      if (ph.type === PointHistoryType.EARN) {
        details = `Earned ${ph.points} points`;
      } else if (ph.type === PointHistoryType.REDEEM) {
        details = `Redeemed ${ph.reward ? ph.reward.title : 'Reward'}`;
      } else {
        details = `${ph.type} ${ph.points} points`;
      }

      // Use BusinessCampaign name if available
      const campaignName = ph.businessCampaign ? ph.businessCampaign.name : (ph.campaign ? ph.campaign.name : 'Unknown');

      return {
        participantId: ph.participant ? ph.participant.id : 'Unknown',
        participantName: ph.participant ? ph.participant.name : 'Unknown',
        activityType: ph.type,
        details,
        date: ph.created_at,
        campaignName,
      };
    });

    return {
      data: activities,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      next: page < Math.ceil(total / limit) ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async getParticipantActivityTimeline(
    businessId: string,
    participantId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCustomerActivityResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where: {
        business: { id: businessId },
        participant: { id: participantId },
      },
      relations: ['participant', 'reward', 'campaign', 'businessCampaign'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const activities = data.map((ph) => {
      let details = '';
      if (ph.type === PointHistoryType.EARN) {
        details = `Earned ${ph.points} points`;
      } else if (ph.type === PointHistoryType.REDEEM) {
        details = `Redeemed ${ph.reward ? ph.reward.title : 'Reward'}`;
      } else {
        details = `${ph.type} ${ph.points} points`;
      }

      const campaignName = ph.businessCampaign ? ph.businessCampaign.name : (ph.campaign ? ph.campaign.name : 'Unknown');

      return {
        participantId: ph.participant ? ph.participant.id : 'Unknown',
        participantName: ph.participant ? ph.participant.name : 'Unknown',
        activityType: ph.type,
        details,
        date: ph.created_at,
        campaignName,
      };
    });

    return {
      data: activities,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      next: page < Math.ceil(total / limit) ? Number(page) + 1 : null,
      previous: page > 1 ? Number(page) - 1 : null,
    };
  }

  async findPublicCampaign(identifier: string): Promise<BusinessCampaign | Campaign> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(identifier);

    let businessCampaign: BusinessCampaign | null = null;
    let campaign: Campaign | null = null;

    // Try finding BusinessCampaign
    if (isUuid) {
      businessCampaign = await this.businessCampaignRepository.findOne({
        where: { id: identifier },
        relations: ['campaign', 'business', 'rewards'],
      });
    } else {
      businessCampaign = await this.businessCampaignRepository.findOne({
        where: { uniqueCode: identifier },
        relations: ['campaign', 'business', 'rewards'],
      });
    }

    if (businessCampaign) {
      const now = new Date();
      if (businessCampaign.end_date < now) throw new BadRequestException('Campaign has expired');
      if (businessCampaign.disabled) throw new BadRequestException('Campaign is disabled');
      return businessCampaign;
    }

    // Try finding Campaign (admin templates, if public)
    if (isUuid) {
      campaign = await this.campaignRepository.findOne({
        where: { id: identifier },
        relations: ['business', 'rewards'],
      });
    } else {
      campaign = await this.campaignRepository.findOne({
        where: { uniqueCode: identifier },
        relations: ['business', 'rewards'],
      });
    }

    if (campaign) {
      const now = new Date();
      if (campaign.end_date < now) throw new BadRequestException('Campaign has expired');
      if (campaign.disabled) throw new BadRequestException('Campaign is disabled');
      return campaign;
    }

    throw new NotFoundException('Campaign not found');
  }

  async countActiveCampaigns(businessId: string): Promise<number> {
    const now = new Date();
    return this.businessCampaignRepository.count({
      where: {
        business: { id: businessId },
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
        disabled: false,
      },
    });
  }

  async countRewards(campaignId: string): Promise<number> {
    const campaign = await this.findOne(campaignId);
    return campaign.rewards ? campaign.rewards.length : 0;
  }

  async countTotalCampaigns(userId: string): Promise<number> {
    return await this.businessCampaignRepository.count({
      where: { business: { id: userId } },
    });
  }

  async countTotalParticipantJoins(businessId: string): Promise<number> {
    const result = await this.businessCampaignRepository.createQueryBuilder('bc')
      .innerJoin('bc.participantCampaignBalances', 'pcb')
      .where('bc.business_id = :businessId', { businessId })
      .select('COUNT(pcb.id)', 'count')
      .getRawOne();

    return parseInt(result.count, 10) || 0;
  }
}
