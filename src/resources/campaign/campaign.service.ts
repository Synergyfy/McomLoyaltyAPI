import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  In,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Not,
} from "typeorm";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import {
  UpdateCampaignDto,
  UpdateCampaignAdminDto,
} from "./dto/update-campaign.dto";
import { Campaign } from "./entities/campaign.entity";
import { Business } from "../business/entities/business.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { BusinessCampaign } from "./entities/business-campaign.entity";
import { Admin } from "../admin/entities/admin.entity";
import { Role } from "../../common/role.enum";
import {
  PointHistory,
  PointHistoryType,
} from "../participant-campaign-balance/entities/point-history.entity";
import { Participant } from "../participant/entities/participant.entity";
import { Staff } from "../staff/entities/staff.entity";
import { CampaignAnalyticsQueryDto } from "./dto/campaign-analytics-query.dto";
import { User } from "src/common/interfaces/user.interface";
import { CreateCampaignAdminDto } from "./dto/create-campaign-admin.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { nanoid } from "nanoid";
import { PaginatedCustomerActivityResponseDto } from "./dto/customer-activity-response.dto";
import { PaginatedCampaignResponseDto } from "./dto/paginated-campaign-response.dto";
import {
  PublicCampaignQueryDto,
  CampaignSortOrder,
} from "./dto/public-campaign-query.dto";

import {
  CampaignType,
  AudienceType,
  CampaignRewardMode,
} from "./entities/campaign-enums";
import { WishlistAggregate } from "../wishlist/entities/wishlist-aggregate.entity";
import { WishlistItem } from "../wishlist/entities/wishlist-item.entity";
import { MailService } from "src/mail/mail.service";
import { CreateCampaignFromWishlistDto } from "./dto/create-campaign-from-wishlist.dto";
import { Tier } from "../tier/entities/tier.entity";
import { TierProgressionService } from "../tier-progression/tier-progression.service";
import {
  CapabilityService,
  ActionType,
} from "../capability/capability.service";
import { TierAnalyticsResponseDto } from "./dto/tier-analytics-response.dto";
import {
  Membership,
  MembershipStatus,
} from "../membership/entities/membership.entity";
import { ParticipantCampaignBalance } from "../participant-campaign-balance/entities/participant-campaign-balance.entity";

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
    @InjectRepository(ParticipantCampaignBalance)
    private readonly participantCampaignBalanceRepository: Repository<ParticipantCampaignBalance>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => TierProgressionService))
    private readonly tierProgressionService: TierProgressionService,
    @Inject(forwardRef(() => CapabilityService))
    private readonly capabilityService: CapabilityService,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto | CreateCampaignAdminDto,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    if (currentUser.role === Role.Admin) {
      const { business_id, reward_ids, target_tier_ids, ...campaignData } =
        createCampaignDto as CreateCampaignAdminDto;
      const campaign = this.campaignRepository.create(campaignData);
      let rewards: Reward[] = [];

      if (business_id) {
        const business = await this.businessRepository.findOneBy({
          id: business_id,
        });
        if (!business) {
          throw new NotFoundException("Business not found");
        }
        campaign.business = business;
      }

      if (reward_ids && reward_ids.length > 0) {
        rewards = await this.rewardRepository.findBy({
          id: In(reward_ids),
        });
      }

      if (target_tier_ids && target_tier_ids.length > 0) {
        const tiers = await this.tierRepository.findBy({
          id: In(target_tier_ids),
        });

        if (tiers.length !== target_tier_ids.length) {
          throw new NotFoundException("One or more target tiers not found");
        }

        // Validate that all tiers are of the same type
        const firstType = tiers[0].type;
        const allSameType = tiers.every((t) => t.type === firstType);
        if (!allSameType) {
          throw new BadRequestException(
            "All selected target tiers must be of the same type (Standard or Seasonal).",
          );
        }

        // Validate reward limits for each tier
        for (const tier of tiers) {
          const maxRewards = tier.configuration?.quotas?.maxRewardsPerCampaign;
          if (maxRewards !== undefined && maxRewards !== -1) {
            if (rewards.length > maxRewards) {
              throw new BadRequestException(
                `Target tier '${tier.name}' allows a maximum of ${maxRewards} rewards per campaign. You selected ${rewards.length}.`,
              );
            }
          }
        }

        campaign.targetTiers = tiers;
      }

      campaign.rewards = rewards;
      const saved = await this.campaignRepository.save(campaign);
      return saved;
    } else {
      const { business_reward_ids, ...campaignData } =
        createCampaignDto as CreateCampaignDto;

      if (
        campaignData.total_slots === undefined ||
        campaignData.total_slots === null
      ) {
        throw new BadRequestException(
          "Total slots must be defined for a business campaign.",
        );
      }

      if (campaignData.end_date) {
        await this.validateCampaignEndDate(
          currentUser.id,
          campaignData.end_date,
        );
      }

      // Business creating a campaign -> BusinessCampaign
      const businessCampaign =
        this.businessCampaignRepository.create(campaignData);
      businessCampaign.business = currentUser as Business;
      businessCampaign.uniqueCode = nanoid(9);

      businessCampaign.remaining_slots = campaignData.total_slots;

      if (!business_reward_ids || business_reward_ids.length === 0) {
        throw new BadRequestException(
          "Business must add at least one reward to the campaign.",
        );
      }

      // Check tier permission for reward count
      await this.capabilityService.checkPermission(
        currentUser.id,
        ActionType.CREATE_CAMPAIGN,
        {
          isFromScratch: true,
          rewardCount: business_reward_ids.length,
        },
      );

      if (business_reward_ids && business_reward_ids.length > 0) {
        const businessRewards = await this.businessRewardRepository.find({
          where: { id: In(business_reward_ids) },
          relations: ["reward", "business"],
        });

        // Validate that all found rewards belong to the current business
        for (const reward of businessRewards) {
          if (reward.business.id !== currentUser.id) {
            throw new UnauthorizedException(
              `Business Reward with ID ${reward.id} does not belong to your business.`,
            );
          }
        }

        // Also check if all requested IDs were found (optional but good practice)
        if (businessRewards.length !== business_reward_ids.length) {
          throw new BadRequestException(
            "One or more business rewards not found.",
          );
        }

        businessCampaign.businessRewards = businessRewards;
      }
      // businessCampaign.rewards = rewards; // Removed setting rewards
      const savedCampaign =
        await this.businessCampaignRepository.save(businessCampaign);

      // Check for promotion
      await this.tierProgressionService.checkAndPromote(currentUser.id);

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
      relations: ["category"],
    });

    if (!wishlistAggregate) {
      throw new NotFoundException("Wishlist aggregate not found");
    }

    // Find all participants who have this item in their wishlist
    const wishlistItems = await this.wishlistItemRepository.find({
      where: {
        itemName: wishlistAggregate.itemName,
        category: { id: wishlistAggregate.category.id },
        marketingConsent: true,
      },
      relations: ["participant"],
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
          relations: ["reward"],
        });
        businessCampaign.businessRewards = businessRewards;
      }

      createdCampaign =
        await this.businessCampaignRepository.save(businessCampaign);

      // Check for promotion
      await this.tierProgressionService.checkAndPromote(currentUser.id);
    }

    // Send emails to participants
    const businessName =
      currentUser.role === Role.Business
        ? (currentUser as Business).name
        : (createdCampaign as Campaign).business?.name || "Mcom Loyalty";

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

  async findJoinedCampaigns(
    businessId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.businessCampaignRepository
      .createQueryBuilder("bc")
      .leftJoinAndSelect("bc.business", "owner")
      .innerJoin("bc.participatingBusinesses", "pb")
      .where("pb.id = :businessId", { businessId })
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async findAll(
    currentUser: Business | Admin,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    if (currentUser.role === Role.Business) {
      const [data, total] = await this.businessCampaignRepository.findAndCount({
        where: { business: { id: currentUser.id } },
        relations: ["business", "businessRewards"],
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
        relations: ["business", "rewards", "targetTiers", "targetTiers.season"],
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
      .createQueryBuilder("campaign")
      .where("campaign.business_id IS NULL")
      .andWhere(
        "NOT EXISTS (SELECT 1 FROM business_campaigns bc WHERE bc.campaign_id = campaign.id AND bc.business_id = :businessId)",
        { businessId },
      )
      .orderBy("campaign.created_at", "DESC")
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
      relations: ["business", "businessRewards"],
      order: { created_at: "DESC" },
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
      relations: ["business", "rewards", "targetTiers", "targetTiers.season"],
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
      relations: ["business", "rewards", "targetTiers", "targetTiers.season"],
      order: { created_at: "DESC" },
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

  async findOne(
    id: string,
    currentUser?: User,
  ): Promise<Campaign | BusinessCampaign> {
    const businessCampaign = await this.businessCampaignRepository.findOne({
      where: { id },
      relations: ["business", "campaign", "businessRewards"],
    });

    if (businessCampaign) {
      if (!currentUser) {
        return businessCampaign;
      }
      if (
        currentUser.role === Role.Business &&
        businessCampaign.business.id !== currentUser.id
      ) {
        throw new UnauthorizedException();
      }
      if (currentUser.role === Role.Staff) {
        const staff = await this.staffRepository.findOne({
          where: { id: currentUser.id },
          relations: ["business"],
        });
        if (
          !staff ||
          !staff.business ||
          staff.business.id !== businessCampaign.business.id
        ) {
          throw new UnauthorizedException();
        }
      }
      return businessCampaign;
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ["business", "rewards", "targetTiers", "targetTiers.season"],
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
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
    updateCampaignDto: UpdateCampaignDto | UpdateCampaignAdminDto,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    const campaign = await this.findOne(id, currentUser);
    const {
      reward_ids,
      business_reward_ids,
      target_tier_ids,
      ...campaignData
    } = updateCampaignDto as any;

    if (currentUser.role === Role.Admin) {
      // Admin updating Campaign
      if (business_reward_ids && business_reward_ids.length > 0) {
        throw new BadRequestException(
          "Admins can only update admin rewards. Please use 'reward_ids'.",
        );
      }

      if (campaign instanceof Campaign) {
        if (reward_ids) {
          const rewards = await this.rewardRepository.findBy({
            id: In(reward_ids),
          });
          campaign.rewards = rewards;
        }

        if (target_tier_ids) {
          if (target_tier_ids.length > 0) {
            const tiers = await this.tierRepository.findBy({
              id: In(target_tier_ids),
            });

            if (tiers.length !== target_tier_ids.length) {
              throw new NotFoundException("One or more target tiers not found");
            }

            // Validate that all tiers are of the same type
            const firstType = tiers[0].type;
            const allSameType = tiers.every((t) => t.type === firstType);
            if (!allSameType) {
              throw new BadRequestException(
                "All selected target tiers must be of the same type (Standard or Seasonal).",
              );
            }
            // Validate reward limits for each tier
            const currentRewards =
              reward_ids && reward_ids.length > 0 ? campaign.rewards : []; // rewardRepository.findBy was used to update campaign.rewards above

            for (const tier of tiers) {
              const maxRewards =
                tier.configuration?.quotas?.maxRewardsPerCampaign;
              if (maxRewards !== undefined && maxRewards !== -1) {
                if (campaign.rewards && campaign.rewards.length > maxRewards) {
                  throw new BadRequestException(
                    `Target tier '${tier.name}' allows a maximum of ${maxRewards} rewards per campaign. You selected ${campaign.rewards.length}.`,
                  );
                }
              }
            }

            campaign.targetTiers = tiers;
          } else {
            campaign.targetTiers = [];
          }
        }
      }
    } else {
      // Business updating BusinessCampaign
      if (reward_ids && reward_ids.length > 0) {
        throw new BadRequestException(
          "Businesses can only update business rewards. Please use 'business_reward_ids'.",
        );
      }

      if (campaign instanceof BusinessCampaign) {
        // Check if claimed (Template)
        if (campaign.campaign) {
          await this.capabilityService.checkPermission(
            currentUser.id,
            ActionType.EDIT_TEMPLATE,
          );
        }

        if (business_reward_ids) {
          const businessRewards = await this.businessRewardRepository.find({
            where: { id: In(business_reward_ids) },
            relations: ["reward"],
          });
          campaign.businessRewards = businessRewards;
        }

        // Validation: Ensure at least one type of reward is present
        const hasBusinessRewards =
          campaign.businessRewards && campaign.businessRewards.length > 0;
        if (!hasBusinessRewards) {
          throw new BadRequestException(
            "Campaign must have at least one reward.",
          );
        }
      }

      // --- Business Logic Restrictions ---
      if (
        currentUser.role === Role.Business &&
        campaign instanceof BusinessCampaign
      ) {
        const now = new Date();
        const isExpired = new Date(campaign.end_date) < now;

        if (campaignData.end_date) {
          await this.validateCampaignEndDate(
            currentUser.id,
            campaignData.end_date,
          );
        }

        if (campaignData.remaining_slots !== undefined) {
          throw new BadRequestException(
            "Businesses cannot edit remaining_slots directly.",
          );
        }

        const participantCount =
          await this.participantCampaignBalanceRepository.count({
            where: { businessCampaign: { id } },
          });
        const hasParticipants = participantCount > 0;

        if (campaignData.total_slots !== undefined) {
          if (campaignData.total_slots < participantCount) {
            throw new BadRequestException(
              `Total slots cannot be less than the current participant count (${participantCount}).`,
            );
          }
        }

        if (isExpired) {
          // If campaign end date has passed, they can edit the start and end date but the start date must not be in the past
          if (campaignData.start_date) {
            const nextStartDate = new Date(campaignData.start_date);
            if (nextStartDate < now) {
              throw new BadRequestException(
                "New start date must not be in the past.",
              );
            }
          }
        } else {
          // If the campaign has start date they can't edit it if the campaign has participant but they can edit end date
          if (campaign.start_date && hasParticipants) {
            const allowedKeys = [
              "end_date",
              "total_slots",
              "business_reward_ids",
              // remaining_slots removed from allowed as it's handled above
            ];
            const updateKeys = Object.keys(campaignData);
            const disallowedKeys = updateKeys.filter(
              (key) => !allowedKeys.includes(key),
            );

            if (disallowedKeys.length > 0) {
              throw new BadRequestException(
                `Cannot edit ${disallowedKeys.join(", ")} because the campaign has participants. Only 'end_date' and 'total_slots' can be updated.`,
              );
            }
          }
        }
      }
    }

    // Capture old total slots for sync
    const oldTotalSlots =
      campaign instanceof BusinessCampaign ? campaign.total_slots : 0;

    Object.assign(campaign, campaignData);

    if (campaign instanceof BusinessCampaign) {
      if (campaignData.total_slots !== undefined) {
        if (
          campaign.remaining_slots === null ||
          campaign.remaining_slots === undefined
        ) {
          campaign.remaining_slots = campaignData.total_slots;
        } else {
          // Sync remaining_slots if total_slots changed
          const diff = campaignData.total_slots - oldTotalSlots;
          if (diff !== 0) {
            campaign.remaining_slots += diff;
          }
        }
      }
      const saved = await this.businessCampaignRepository.save(campaign);
      return saved;
    } else {
      const saved = await this.campaignRepository.save(campaign);
      return saved;
    }
  }

  async remove(id: string, currentUser: Business | Admin): Promise<void> {
    if (currentUser.role === Role.Admin) {
      return this.removeTemplate(id, currentUser as Admin);
    } else {
      return this.removeBusinessCampaign(id, currentUser as Business);
    }
  }

  async removeTemplate(id: string, admin: Admin): Promise<void> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, business: IsNull() },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign template not found");
    }

    const now = new Date();
    const claimedCampaigns = await this.businessCampaignRepository.find({
      where: { campaign: { id } },
    });

    if (claimedCampaigns.length > 0) {
      const runningCampaigns = claimedCampaigns.filter((bc) => {
        if (!bc.start_date || !bc.end_date) return false;
        const startDate = new Date(bc.start_date);
        const endDate = new Date(bc.end_date);
        return startDate <= now && endDate >= now;
      });

      if (runningCampaigns.length > 0) {
        throw new BadRequestException(
          "Cannot delete this campaign template because it is currently running in one or more businesses.",
        );
      }
    }

    await this.campaignRepository.remove(campaign);
  }

  async removeBusinessCampaign(id: string, business: Business): Promise<void> {
    const businessCampaign = await this.businessCampaignRepository.findOne({
      where: { id, business: { id: business.id } },
    });

    if (!businessCampaign) {
      throw new NotFoundException("Business campaign not found");
    }

    const participantCount =
      await this.participantCampaignBalanceRepository.count({
        where: { businessCampaign: { id } },
      });

    const now = new Date();
    const isExpired = new Date(businessCampaign.end_date) < now;

    if (participantCount > 0 && !isExpired) {
      throw new BadRequestException(
        "Cannot delete a campaign that has participants and has not ended yet.",
      );
    }

    await this.businessCampaignRepository.remove(businessCampaign);
  }

  async findOngoingCampaigns(): Promise<BusinessCampaign[]> {
    const now = new Date();
    return this.businessCampaignRepository.find({
      where: {
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
        disabled: false,
      },
      relations: ["business"],
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
        relations: ["business"],
      });

      if (!staff || !staff.business) {
        throw new UnauthorizedException(
          "Staff or associated business not found",
        );
      }
      businessId = staff.business.id;
    }

    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const now = new Date();

    // Let's stick to QB for efficiency
    const qb = this.businessCampaignRepository
      .createQueryBuilder("bc")
      .leftJoinAndSelect("bc.business", "business")
      .leftJoinAndSelect("bc.businessRewards", "businessRewards")
      .where("bc.business_id = :businessId", { businessId })
      .andWhere("bc.start_date <= :now", { now })
      .andWhere("bc.end_date >= :now", { now })
      .andWhere("bc.disabled = :disabled", { disabled: false })
      .addSelect(
        (subQuery) =>
          subQuery
            .select("COUNT(DISTINCT ph.participant_id)", "participant_count")
            .from(PointHistory, "ph")
            .where("ph.business_campaign_id = bc.id"),
        "participantCount",
      )
      .orderBy("bc.created_at", "DESC")
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
        relations: ["business"],
      });

      if (!staff || !staff.business) {
        throw new UnauthorizedException(
          "Staff or associated business not found",
        );
      }
      businessId = staff.business.id;
    }

    const participant = await this.participantRepository.findOne({
      where: [{ email: query }, { uniqueCode: query }],
    });

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    // Find BusinessCampaigns where the participant has a balance
    const qb = this.businessCampaignRepository
      .createQueryBuilder("bc")
      .leftJoinAndSelect("bc.businessRewards", "businessRewards")
      .leftJoinAndSelect("bc.business", "business")
      .innerJoin(
        "bc.participantCampaignBalances",
        "pcb",
        "pcb.participantId = :participantId",
        { participantId: participant.id },
      )
      .where("bc.business_id = :businessId", { businessId })
      .andWhere("bc.disabled = :disabled", { disabled: false });

    return qb.getMany() as any;
  }

  async toggleCampaignStatus(
    id: string,
    currentUser: Business | Admin,
  ): Promise<Campaign | BusinessCampaign> {
    const campaign = await this.findOne(id, currentUser);
    campaign.disabled = !campaign.disabled;
    let saved;
    if (campaign instanceof BusinessCampaign) {
      saved = await this.businessCampaignRepository.save(campaign);
    } else {
      saved = await this.campaignRepository.save(campaign);
    }
    return saved;
  }

  async findAllPublic(
    query: PublicCampaignQueryDto,
  ): Promise<PaginatedCampaignResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sort = query.sort || CampaignSortOrder.DESC;
    const sectorId = query.sectorId || "";
    const categoryId = query.categoryId || "";
    const subCategoryId = query.subCategoryId || "";
    const search = query.search || "";

    const skip = (page - 1) * limit;
    const sortOrder = query.sort || CampaignSortOrder.DESC;
    const now = new Date();

    // 1. Query for BusinessCampaign IDs
    const qbBusiness = this.businessCampaignRepository
      .createQueryBuilder("campaign")
      .leftJoin("campaign.business", "business")
      .innerJoin("campaign.businessRewards", "businessRewards")
      .select(["campaign.id", "campaign.created_at"])
      .where("campaign.disabled = :disabled", { disabled: false })
      .andWhere("campaign.start_date IS NOT NULL")
      .andWhere("campaign.end_date IS NOT NULL")
      .andWhere("campaign.start_date <= :now", { now })
      .andWhere("campaign.end_date >= :now", { now })
      .andWhere("businessRewards.remaining_quantity > 1");

    if (query.sectorId) {
      qbBusiness.andWhere("business.sector = :sectorId", {
        sectorId: query.sectorId,
      });
    }
    if (query.categoryId) {
      qbBusiness.andWhere("business.category = :categoryId", {
        categoryId: query.categoryId,
      });
    }
    if (query.subCategoryId) {
      qbBusiness.andWhere("business.subCategory = :subCategoryId", {
        subCategoryId: query.subCategoryId,
      });
    }
    if (query.search) {
      qbBusiness.andWhere("campaign.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    const businessCampaignsRaw = await qbBusiness.getMany();

    // 2. Sort
    const combined = [
      ...businessCampaignsRaw.map((c) => ({
        id: c.id,
        created_at: c.created_at,
      })),
    ];

    combined.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === CampaignSortOrder.ASC
        ? dateA - dateB
        : dateB - dateA;
    });

    const total = combined.length;
    const paginatedIds = combined.slice(skip, skip + limit);

    // 3. Fetch Full Entities
    const businessIds = paginatedIds.map((i) => i.id);

    let businessCampaigns: BusinessCampaign[] = [];

    if (businessIds.length > 0) {
      businessCampaigns = await this.businessCampaignRepository.find({
        where: { id: In(businessIds) },
        relations: [
          "business",
          "business.sector",
          "business.category",
          "business.subCategory",
          "businessRewards",
        ],
      });
    }

    // 4. Restore Order
    const resultMap = new Map<string, any>();
    businessCampaigns.forEach((c) => resultMap.set(c.id, c));

    const data = paginatedIds
      .map((item) => resultMap.get(item.id))
      .filter(Boolean)
      .map((campaign: any) => {
        // Flatten Business Info
        if (campaign.business) {
          campaign.business.sectorName = campaign.business.sector?.name;
          campaign.business.categoryName = campaign.business.category?.name;
          campaign.business.subCategoryName =
            campaign.business.subCategory?.name;

          delete campaign.business.sector;
          delete campaign.business.category;
          delete campaign.business.subCategory;
          delete campaign.business.password;
          delete campaign.business.total_points_earned;
          delete campaign.business.total_points_redeemed;
          delete campaign.business.stripe_customer_id;
          delete campaign.business.wallet;
          delete campaign.business.isEmailVerified;
        }
        return campaign;
      });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    const result = {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };

    return result;
  }

  async getAnalytics(currentUser: User, query: CampaignAnalyticsQueryDto) {
    const { campaignId } = query;
    const businessId = currentUser.id;

    const qb = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .leftJoin("ph.businessCampaign", "bc") // Changed to businessCampaign
      .where("ph.business_id = :businessId", { businessId });

    if (campaignId) {
      qb.andWhere("bc.id = :campaignId", { campaignId });
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
    startDate: Date,
    endDate: Date,
    total_slots?: number,
  ): Promise<BusinessCampaign> {
    await this.validateCampaignEndDate(businessId, endDate);
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, business: IsNull() },
      relations: ["rewards"],
    });

    if (!campaign) {
      throw new NotFoundException(
        "Campaign not found or not claimable by business",
      );
    }

    const existingClaim = await this.businessCampaignRepository.findOne({
      where: {
        business: { id: businessId },
        campaign: { id: campaignId },
      },
    });

    if (existingClaim) {
      throw new UnauthorizedException("Campaign already claimed");
    }

    const business = await this.businessRepository.findOneBy({
      id: businessId,
    });
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    // Fetch and validate business rewards
    const businessRewards = await this.businessRewardRepository.find({
      where: { id: In(businessRewardIds) },
      relations: ["business", "reward"],
    });

    if (businessRewards.length !== businessRewardIds.length) {
      throw new BadRequestException("One or more business rewards not found.");
    }

    for (const reward of businessRewards) {
      if (reward.business.id !== businessId) {
        throw new UnauthorizedException(
          `Business Reward with ID ${reward.id} does not belong to your business.`,
        );
      }
    }

    if (total_slots === undefined || total_slots === null) {
      throw new BadRequestException(
        "Total slots must be defined when claiming a campaign.",
      );
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
      start_date: startDate,
      end_date: endDate,
      audience_type: campaign.audience_type,
      banner_url: campaign.banner_url,
      logo_url: campaign.logo_url,
      signUpPoint: campaign.signUpPoint,
      regular_points_threshold: campaign.regular_points_threshold,
      earn_point_page_title: campaign.earn_point_page_title,
      earn_point_page_description: campaign.earn_point_page_description,
      redeem_reward_page_title: campaign.redeem_reward_page_title,
      redeem_reward_page_description: campaign.redeem_reward_page_description,
      contact_us_page_title: campaign.contact_us_page_title,
      contact_us_page_description: campaign.contact_us_page_description,
      contact_email: campaign.contact_email,
      contact_phone_number: campaign.contact_phone_number,
      footer_text: campaign.footer_text,
      total_slots: total_slots,
      remaining_slots: total_slots,
    });

    // Link business rewards
    businessCampaign.businessRewards = businessRewards;

    const saved = await this.businessCampaignRepository.save(businessCampaign);
    return saved;
  }

  async getCampaignAnalytics(campaignId: string, businessId: string) {
    const analyticsQuery = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .where("ph.business_campaign_id = :campaignId", { campaignId })
      .andWhere("ph.business_id = :businessId", { businessId })
      .select([
        "SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS total_points_earned",
        "SUM(CASE WHEN ph.type = 'REDEEM' THEN ph.points ELSE 0 END) AS total_points_redeemed",
        "COUNT(CASE WHEN ph.type = 'EARN' THEN 1 END) AS total_earns",
        "COUNT(CASE WHEN ph.type = 'REDEEM' THEN 1 END) AS total_redemptions",
        "COUNT(CASE WHEN ph.type = 'REDEEM' AND ph.reward_id IS NOT NULL THEN 1 END) AS total_rewards_redeemed",
        "COUNT(DISTINCT ph.participant_id) AS total_participants",
      ])
      .getRawOne();

    const weeklyChartDataQuery = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .where("ph.business_campaign_id = :campaignId", { campaignId })
      .andWhere("ph.business_id = :businessId", { businessId })
      .andWhere("ph.created_at >= NOW() - INTERVAL '7 days'")
      .select([
        "TO_CHAR(ph.created_at, 'YYYY-MM-DD') AS date",
        "SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS points_earned",
        "SUM(CASE WHEN ph.type = 'REDEEM' THEN ph.points ELSE 0 END) AS points_redeemed",
      ])
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    const rankedParticipantsQuery = this.pointHistoryRepository
      .createQueryBuilder("ph")
      .leftJoin("ph.participant", "p")
      .where("ph.business_campaign_id = :campaignId", { campaignId })
      .andWhere("ph.business_id = :businessId", { businessId })
      .select([
        "p.id",
        "p.name",
        "p.email",
        "SUM(CASE WHEN ph.type = 'EARN' THEN ph.points ELSE 0 END) AS total_points_earned",
        "COUNT(CASE WHEN ph.type = 'REDEEM' THEN 1 END) AS total_redemptions",
      ])
      .groupBy("p.id")
      .orderBy("total_redemptions", "DESC")
      .getRawMany();

    const topRewardsQuery = this.rewardRepository
      .createQueryBuilder("r")
      .leftJoin("r.pointHistories", "ph")
      .where("ph.business_campaign_id = :campaignId", { campaignId })
      .andWhere("ph.business_id = :businessId", { businessId })
      .andWhere("ph.type = 'REDEEM'")
      .select([
        "r.id",
        "r.title",
        "r.max_points",
        "COUNT(ph.id) AS total_redemptions",
      ])
      .groupBy("r.id")
      .orderBy("total_redemptions", "DESC")
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
      relations: ["participant", "reward", "campaign", "businessCampaign"], // added businessCampaign
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const activities = data.map((ph) => {
      let details = "";
      if (ph.type === PointHistoryType.EARN) {
        details = `Earned ${ph.points} points`;
      } else if (ph.type === PointHistoryType.REDEEM) {
        details = `Redeemed ${ph.reward ? ph.reward.title : "Reward"}`;
      } else {
        details = `${ph.type} ${ph.points} points`;
      }

      // Use BusinessCampaign name if available
      const campaignName = ph.businessCampaign
        ? ph.businessCampaign.name
        : ph.campaign
          ? ph.campaign.name
          : "Unknown";

      return {
        participantId: ph.participant ? ph.participant.id : "Unknown",
        participantName: ph.participant ? ph.participant.name : "Unknown",
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
      relations: ["participant", "reward", "campaign", "businessCampaign"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    const activities = data.map((ph) => {
      let details = "";
      if (ph.type === PointHistoryType.EARN) {
        details = `Earned ${ph.points} points`;
      } else if (ph.type === PointHistoryType.REDEEM) {
        details = `Redeemed ${ph.reward ? ph.reward.title : "Reward"}`;
      } else {
        details = `${ph.type} ${ph.points} points`;
      }

      const campaignName = ph.businessCampaign
        ? ph.businessCampaign.name
        : ph.campaign
          ? ph.campaign.name
          : "Unknown";

      return {
        participantId: ph.participant ? ph.participant.id : "Unknown",
        participantName: ph.participant ? ph.participant.name : "Unknown",
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

  async findPublicCampaign(
    identifier: string,
  ): Promise<BusinessCampaign | Campaign> {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(identifier);

    let businessCampaign: BusinessCampaign | null = null;
    let campaign: Campaign | null = null;

    // Try finding BusinessCampaign
    if (isUuid) {
      businessCampaign = await this.businessCampaignRepository.findOne({
        where: { id: identifier },
        relations: ["campaign", "business", "businessRewards"],
      });
    } else {
      businessCampaign = await this.businessCampaignRepository.findOne({
        where: { uniqueCode: identifier },
        relations: ["campaign", "business", "businessRewards"],
      });
    }

    if (businessCampaign) {
      const now = new Date();
      if (businessCampaign.end_date < now)
        throw new BadRequestException("Campaign has expired");
      if (businessCampaign.disabled)
        throw new BadRequestException("Campaign is disabled");
      return businessCampaign;
    }

    // Try finding Campaign (admin templates, if public)
    if (isUuid) {
      campaign = await this.campaignRepository.findOne({
        where: { id: identifier },
        relations: ["business", "rewards"],
      });
    } else {
      campaign = await this.campaignRepository.findOne({
        where: { uniqueCode: identifier },
        relations: ["business", "rewards"],
      });
    }

    if (campaign) {
      if (campaign.disabled)
        throw new BadRequestException("Campaign is disabled");
      return campaign;
    }

    throw new NotFoundException("Campaign not found");
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
    if (campaign instanceof BusinessCampaign) {
      return campaign.businessRewards ? campaign.businessRewards.length : 0;
    }
    return (campaign as Campaign).rewards
      ? (campaign as Campaign).rewards.length
      : 0;
  }

  async countTotalCampaigns(userId: string): Promise<number> {
    return await this.businessCampaignRepository.count({
      where: { business: { id: userId } },
    });
  }

  async countTotalParticipantJoins(businessId: string): Promise<number> {
    const result = await this.businessCampaignRepository
      .createQueryBuilder("bc")
      .innerJoin("bc.participantCampaignBalances", "pcb")
      .where("bc.business_id = :businessId", { businessId })
      .select("COUNT(pcb.id)", "count")
      .getRawOne();

    return parseInt(result.count, 10) || 0;
  }
  async getTierAnalytics(
    campaignId: string,
  ): Promise<TierAnalyticsResponseDto> {
    const campaignStats = await this.businessCampaignRepository
      .createQueryBuilder("bc")
      .innerJoin("bc.business", "b")
      .innerJoin("b.memberships", "m")
      .innerJoin("m.tier", "t")
      .where("bc.campaign_id = :campaignId", { campaignId })
      .andWhere("m.status = :status", { status: MembershipStatus.ACTIVE })
      .select([
        't.id AS "tierId"',
        't.name AS "tierName"',
        'COUNT(bc.id) AS "claimsCount"',
        'SUM(bc.total_points_earned) AS "totalPointsEarned"',
        'SUM(bc.total_points_redeemed) AS "totalPointsRedeemed"',
      ])
      .groupBy("t.id")
      .addGroupBy("t.name")
      .getRawMany();

    const participantStats = await this.participantCampaignBalanceRepository
      .createQueryBuilder("pcb")
      .innerJoin("pcb.businessCampaign", "bc")
      .innerJoin("bc.business", "b")
      .innerJoin("b.memberships", "m")
      .innerJoin("m.tier", "t")
      .where("bc.campaign_id = :campaignId", { campaignId })
      .andWhere("m.status = :status", { status: MembershipStatus.ACTIVE })
      .select(['t.id AS "tierId"', 'COUNT(pcb.id) AS "totalParticipants"'])
      .groupBy("t.id")
      .getRawMany();

    // Map stats by tierId for easy lookup
    const participantsMap = new Map<string, number>();
    participantStats.forEach((stat) => {
      participantsMap.set(stat.tierId, Number(stat.totalParticipants));
    });

    const data = campaignStats.map((row) => ({
      tierId: row.tierId,
      tierName: row.tierName,
      claimsCount: Number(row.claimsCount),
      totalParticipants: participantsMap.get(row.tierId) || 0,
      totalPointsEarned: Number(row.totalPointsEarned),
      totalPointsRedeemed: Number(row.totalPointsRedeemed),
    }));

    return { data };
  }

  private async validateCampaignEndDate(businessId: string, endDate: Date) {
    const business = await this.businessRepository.findOneBy({
      id: businessId,
    });
    if (business && business.isSuperBusiness) return;

    const activeMemberships = await this.membershipRepository.find({
      where: {
        business: { id: businessId },
        status: MembershipStatus.ACTIVE,
      },
      order: { expires_at: "DESC" },
    });

    if (activeMemberships.length === 0) {
      throw new BadRequestException("Business has no active tier membership.");
    }

    const latestExpiry = activeMemberships[0].expires_at;
    if (new Date(endDate) > new Date(latestExpiry)) {
      throw new BadRequestException(
        `Campaign end date cannot exceed your tier membership expiration date (${latestExpiry.toISOString().split("T")[0]}).`,
      );
    }
  }
}
