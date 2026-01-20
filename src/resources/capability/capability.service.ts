import {
  Injectable,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from "@nestjs/common";
import { MembershipService } from "../membership/membership.service";
import { CampaignService } from "../campaign/campaign.service";
import {
  TierConfig,
  SeasonalTierConfig,
  ProgressionBenefits,
  TrialTierConfig,
} from "../tier/interfaces/tier-config.interface";
import { TierType } from "../tier/entities/tier-type.enum";
import { MembershipStatus } from "../membership/entities/membership.entity";
import { RewardsService } from "../rewards/services/rewards.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import {
  PointHistory,
  PointHistoryType,
} from "../participant-campaign-balance/entities/point-history.entity";
import { Staff } from "../staff/entities/staff.entity";
import { BusinessService } from "../business/services/business.service";
import moment from "moment";

export enum ActionType {
  CREATE_CAMPAIGN = "CREATE_CAMPAIGN",
  CREATE_REWARD = "CREATE_REWARD",
  ACCESS_ANALYTICS = "ACCESS_ANALYTICS",
  ACCESS_CRM = "ACCESS_CRM",
  EDIT_TEMPLATE = "EDIT_TEMPLATE",
  UPDATE_CAMPAIGN = "UPDATE_CAMPAIGN",
  ADD_REWARD_TO_BUSINESS = "ADD_REWARD_TO_BUSINESS",
  UPDATE_REWARD = "UPDATE_REWARD",
  AWARD_POINTS = "AWARD_POINTS",
  AWARD_STAMPS = "AWARD_STAMPS",
  CREATE_STAFF = "CREATE_STAFF",
}

@Injectable()
export class CapabilityService {
  private readonly logger = new Logger(CapabilityService.name);

  constructor(
    private readonly membershipService: MembershipService,
    @Inject(forwardRef(() => CampaignService))
    private readonly campaignService: CampaignService,
    private readonly rewardsService: RewardsService,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @Inject(forwardRef(() => BusinessService))
    private readonly businessService: BusinessService,
  ) {}

  async checkPermission(
    userId: string,
    action: ActionType,
    context?: any,
  ): Promise<void> {
    // 0. Check for Super Business
    const business = await this.businessService.findById(userId);
    if (business && business.isSuperBusiness) {
      return; // Super Business has no limitations
    }

    // 1. Fetch User's Active Memberships
    const memberships =
      await this.membershipService.findActiveMemberships(userId);

    const standardMembership = memberships.find(
      (m) => m.tier && m.tier.type === TierType.STANDARD,
    );

    // Filter valid seasonal memberships (active dates)
    const seasonalMemberships = memberships.filter((m) => {
      if (!m.tier || m.tier.type !== TierType.SEASONAL) return false;
      const now = new Date();
      // Use membership dates as primary truth, fallback to tier dates
      const start = m.starts_at || m.tier.season?.startDate;
      const end = m.expires_at || m.tier.season?.endDate;
      // Check if NOW is within [start, end]
      return (!start || now >= start) && (!end || now <= end);
    });

    if (!standardMembership && seasonalMemberships.length === 0) {
      this.logger.warn(`User ${userId} has no active membership.`);
      throw new ForbiddenException("Active membership required.");
    }

    let effectiveConfig: TierConfig = null;

    if (standardMembership && standardMembership.tier.configuration) {
      effectiveConfig = { ...standardMembership.tier.configuration };

      const progressionLevel = standardMembership.progression_level;
      const proConfig = effectiveConfig.pro;
      const proPlusConfig = effectiveConfig.pro_plus;

      // Apply Progression Level Overrides (Standard Only)
      if (progressionLevel === "pro" && proConfig) {
        effectiveConfig = this.mergeProgressionBenefits(
          effectiveConfig,
          proConfig.benefits,
        );
      } else if (progressionLevel === "pro_plus" && proPlusConfig) {
        effectiveConfig = this.mergeProgressionBenefits(
          effectiveConfig,
          proPlusConfig.benefits,
        );
      }

      // Apply Trial Configuration Overrides
      if (standardMembership.is_trial && effectiveConfig.trial) {
        effectiveConfig = this.mergeTrialConfig(
          effectiveConfig,
          effectiveConfig.trial,
        );
      }
    }

    // If no standard, start with first seasonal
    if (!effectiveConfig && seasonalMemberships.length > 0) {
      effectiveConfig = { ...seasonalMemberships[0].tier.configuration };
    }

    if (!effectiveConfig) {
      this.logger.warn(`User ${userId} has no tier configuration.`);
      throw new ForbiddenException("Tier configuration missing.");
    }

    // Apply Seasonal Overrides (Overlay on top of Standard or Base Seasonal)
    for (const seaMem of seasonalMemberships) {
      // If we started with this seasonal one, skip
      if (!standardMembership && seaMem === seasonalMemberships[0]) continue;

      if (seaMem.tier.configuration) {
        // We treat the seasonal tier config as an "override"
        effectiveConfig = this.mergeSeasonalConfig(
          effectiveConfig,
          seaMem.tier.configuration as any,
        );
      }
    }

    // 4. Calculate Effective Limits & Check Permissions
    switch (action) {
      case ActionType.CREATE_CAMPAIGN:
        await this.checkCampaignLimit(userId, effectiveConfig);
        if (
          !effectiveConfig.featureFlags.canCreateCampaignFromScratch &&
          context?.isFromScratch
        ) {
          this.logger.warn(
            `User ${userId} tried to create campaign from scratch but is not allowed.`,
          );
          throw new ForbiddenException(
            "Your tier does not allow creating campaigns from scratch.",
          );
        }
        if (context?.rewardCount !== undefined) {
          this.checkRewardCountLimit(context.rewardCount, effectiveConfig);
        }
        break;

      case ActionType.UPDATE_CAMPAIGN:
        if (context?.rewardCount !== undefined) {
          this.checkRewardCountLimit(context.rewardCount, effectiveConfig);
        }
        break;

      case ActionType.CREATE_REWARD:
        await this.checkRewardLimit(context?.campaignId, effectiveConfig);
        break;

      case ActionType.ADD_REWARD_TO_BUSINESS:
        await this.checkRewardInventoryLimit(userId, effectiveConfig);
        break;

      case ActionType.ACCESS_ANALYTICS:
        if (!effectiveConfig.featureFlags.hasAccessToAdvancedAnalytics) {
          this.logger.warn(
            `User ${userId} tried to access advanced analytics but is not allowed.`,
          );
          throw new ForbiddenException("Upgrade to access advanced analytics.");
        }
        break;

      case ActionType.ACCESS_CRM:
        if (!effectiveConfig.featureFlags.hasAccessToCRM) {
          this.logger.warn(
            `User ${userId} tried to access CRM but is not allowed.`,
          );
          throw new ForbiddenException("Upgrade to access CRM features.");
        }
        break;

      case ActionType.EDIT_TEMPLATE:
        if (!effectiveConfig.featureFlags.canEditAdminTemplates) {
          this.logger.warn(
            `User ${userId} tried to edit admin template but is not allowed.`,
          );
          throw new ForbiddenException(
            "Your tier does not allow editing admin templates.",
          );
        }
        break;

      case ActionType.UPDATE_REWARD:
        if (!effectiveConfig.featureFlags.canUpdateReward) {
          this.logger.warn(
            `User ${userId} tried to update reward but is not allowed.`,
          );
          throw new ForbiddenException(
            "Your tier does not allow updating rewards.",
          );
        }
        break;

      case ActionType.AWARD_POINTS:
        await this.checkMonthlyPointsAllowance(
          userId,
          effectiveConfig,
          context?.points,
        );
        break;
      case ActionType.AWARD_STAMPS:
        await this.checkMonthlyStampsAllowance(
          userId,
          effectiveConfig,
          context?.stamps || 1,
        );
        break;
      case ActionType.CREATE_STAFF:
        await this.checkTeamMemberLimit(userId, effectiveConfig);
        break;

      default:
        break;
    }
  }

  private mergeSeasonalConfig(
    base: TierConfig,
    override: SeasonalTierConfig,
  ): TierConfig {
    return {
      ...base,
      quotas: { ...base.quotas, ...override.quotas },
      featureFlags: { ...base.featureFlags, ...override.featureFlags },
      progressBonuses: { ...base.progressBonuses, ...override.progressBonuses },
    };
  }

  private mergeProgressionBenefits(
    base: TierConfig,
    benefits: ProgressionBenefits,
  ): TierConfig {
    const merged = {
      ...base,
      quotas: { ...base.quotas, ...benefits.quotas },
      featureFlags: { ...base.featureFlags, ...benefits.featureFlags },
    };

    // Handle bonus points if needed (e.g. add to monthly allowance or just store it)
    if (benefits.bonusPoints) {
      merged.quotas.monthlyPointsAllowance += benefits.bonusPoints;
    }

    return merged;
  }

  private mergeTrialConfig(
    base: TierConfig,
    trialConfig: TrialTierConfig,
  ): TierConfig {
    return {
      ...base,
      quotas: { ...base.quotas, ...trialConfig.quotas },
      featureFlags: { ...base.featureFlags, ...trialConfig.featureFlags },
      progressBonuses: {
        ...base.progressBonuses,
        ...trialConfig.progressBonuses,
      },
    };
  }

  private async checkCampaignLimit(userId: string, config: TierConfig) {
    const baseLimit = config.quotas.maxActiveCampaigns;
    if (baseLimit === -1) return; // Unlimited

    const effectiveLimit = baseLimit;
    const currentUsage =
      await this.campaignService.countActiveCampaigns(userId);

    if (currentUsage >= effectiveLimit) {
      this.logger.warn(
        `User ${userId} reached campaign limit: ${currentUsage}/${effectiveLimit}`,
      );
      throw new ForbiddenException(
        `You have reached your limit of ${effectiveLimit} active campaigns. Upgrade or level up to unlock more.`,
      );
    }
  }

  private async checkRewardLimit(campaignId: string, config: TierConfig) {
    if (!campaignId) return; // Should be provided for this check
    const limit = config.quotas.maxRewardsPerCampaign;
    const currentUsage = await this.campaignService.countRewards(campaignId);
    if (currentUsage >= limit) {
      this.logger.warn(
        `Campaign ${campaignId} reached reward limit: ${currentUsage}/${limit}`,
      );
      throw new ForbiddenException(
        `You have reached the limit of ${limit} rewards per campaign.`,
      );
    }
  }

  private checkRewardCountLimit(count: number, config: TierConfig) {
    const limit = config.quotas.maxRewardsPerCampaign;
    if (count > limit) {
      this.logger.warn(`Reward count ${count} exceeds limit ${limit}`);
      throw new ForbiddenException(
        `You have reached the limit of ${limit} rewards per campaign.`,
      );
    }
  }

  private async checkRewardInventoryLimit(userId: string, config: TierConfig) {
    const limit = config.quotas.maxActiveRewards;
    if (limit === -1) return;

    const currentUsage =
      await this.rewardsService.countActiveBusinessRewards(userId);
    if (currentUsage >= limit) {
      this.logger.warn(
        `User ${userId} reached active reward limit: ${currentUsage}/${limit}`,
      );
      throw new ForbiddenException(
        `You have reached your limit of ${limit} active rewards. Upgrade or level up to unlock more.`,
      );
    }
  }

  private async checkMonthlyPointsAllowance(
    userId: string,
    config: TierConfig,
    pointsToAward: number,
  ) {
    const allowance = config.quotas.monthlyPointsAllowance;
    if (allowance === -1) return; // Unlimited

    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const result = await this.pointHistoryRepository
      .createQueryBuilder("ph")
      .select("SUM(ph.points)", "total")
      .where("ph.business_id = :businessId", { businessId: userId })
      .andWhere("ph.type = :type", { type: PointHistoryType.EARN })
      .andWhere("ph.created_at BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      })
      .getRawOne();

    const totalAwarded =
      result && result.total ? parseInt(result.total, 10) : 0;

    if (totalAwarded + pointsToAward > allowance) {
      this.logger.warn(
        `User ${userId} reached monthly points allowance: ${totalAwarded + pointsToAward}/${allowance}`,
      );
      throw new ForbiddenException(
        `You have reached your monthly points allowance of ${allowance}. Upgrade to award more points.`,
      );
    }
  }

  private async checkMonthlyStampsAllowance(
    userId: string,
    config: TierConfig,
    stampsToAward: number,
  ) {
    const allowance = config.quotas.monthlyStampsAllowance;
    if (allowance === -1) return; // Unlimited

    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const result = await this.pointHistoryRepository
      .createQueryBuilder("ph")
      .select("SUM(ph.stamps)", "total")
      .where("ph.business_id = :businessId", { businessId: userId })
      .andWhere("ph.type = :type", { type: PointHistoryType.STAMP_EARN })
      .andWhere("ph.created_at BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      })
      .getRawOne();

    const totalAwarded =
      result && result.total ? parseInt(result.total, 10) : 0;

    if (totalAwarded + stampsToAward > allowance) {
      this.logger.warn(
        `User ${userId} reached monthly stamps allowance: ${totalAwarded + stampsToAward}/${allowance}`,
      );
      throw new ForbiddenException(
        `You have reached your monthly stamps allowance of ${allowance}. Upgrade to award more stamps.`,
      );
    }
  }

  private async checkTeamMemberLimit(businessId: string, config: TierConfig) {
    const limit = config.quotas.maxTeamMembers;
    if (limit === -1) return; // Unlimited

    const currentCount = await this.staffRepository.count({
      where: { business: { id: businessId } },
    });

    if (currentCount >= limit) {
      this.logger.warn(
        `Business ${businessId} reached team member limit: ${currentCount}/${limit}`,
      );
      throw new ForbiddenException(
        `You have reached your limit of ${limit} team members. Upgrade to add more staff.`,
      );
    }
  }
}
