import { Injectable, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { MembershipService } from '../membership/membership.service';
import { ProgressionService } from '../progression/progression.service';
import { CampaignService } from '../campaign/campaign.service';
import { TierConfig } from '../tier/interfaces/tier-config.interface';
import { MembershipStatus } from '../membership/entities/membership.entity';
import { RewardsService } from '../rewards/services/rewards.service';

export enum ActionType {
    CREATE_CAMPAIGN = 'CREATE_CAMPAIGN',
    CREATE_REWARD = 'CREATE_REWARD',
    ACCESS_ANALYTICS = 'ACCESS_ANALYTICS',
    ACCESS_CRM = 'ACCESS_CRM',
    EDIT_TEMPLATE = 'EDIT_TEMPLATE',
    UPDATE_CAMPAIGN = 'UPDATE_CAMPAIGN',
    ADD_REWARD_TO_BUSINESS = 'ADD_REWARD_TO_BUSINESS',
    UPDATE_REWARD = 'UPDATE_REWARD',
}

@Injectable()
export class CapabilityService {
    constructor(
        private readonly membershipService: MembershipService,
        private readonly progressionService: ProgressionService,
        @Inject(forwardRef(() => CampaignService))
        private readonly campaignService: CampaignService,
        private readonly rewardsService: RewardsService,
    ) { }

    async checkPermission(userId: string, action: ActionType, context?: any): Promise<void> {
        // 1. Fetch User's Tier via Membership
        const membership = await this.membershipService.findOneByUserId(userId);
        if (!membership || membership.status !== MembershipStatus.ACTIVE) {
            throw new ForbiddenException('Active membership required.');
        }

        const tierConfig = membership.tier.configuration;
        if (!tierConfig) {
            throw new ForbiddenException('Tier configuration missing.');
        }

        // Determine effective configuration based on variant
        let effectiveConfig = { ...tierConfig };
        const variant = membership.variant;

        if (variant === 'pro' && tierConfig.enablePro && tierConfig.pro) {
            effectiveConfig = this.mergeConfig(effectiveConfig, tierConfig.pro);
        } else if (variant === 'pro_plus' && tierConfig.enableProPlus && tierConfig.pro_plus) {
            effectiveConfig = this.mergeConfig(effectiveConfig, tierConfig.pro_plus);
        }

        // 2. Fetch User's Progression Level
        const progression = await this.progressionService.getBusinessProgression(userId);
        const currentLevelName = progression?.currentLevel?.name;

        // 3. Calculate Effective Limits & Check Permissions
        switch (action) {
            case ActionType.CREATE_CAMPAIGN:
                await this.checkCampaignLimit(userId, effectiveConfig, currentLevelName);
                if (!effectiveConfig.featureFlags.canCreateCampaignFromScratch && context?.isFromScratch) {
                    throw new ForbiddenException('Your tier does not allow creating campaigns from scratch.');
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
                    throw new ForbiddenException('Upgrade to access advanced analytics.');
                }
                break;

            case ActionType.ACCESS_CRM:
                if (!effectiveConfig.featureFlags.hasAccessToCRM) {
                    throw new ForbiddenException('Upgrade to access CRM features.');
                }
                break;

            case ActionType.EDIT_TEMPLATE:
                if (!effectiveConfig.featureFlags.canEditAdminTemplates) {
                    throw new ForbiddenException('Your tier does not allow editing admin templates.');
                }
                break;

            case ActionType.UPDATE_REWARD:
                if (!effectiveConfig.featureFlags.canUpdateReward) {
                    throw new ForbiddenException('Your tier does not allow updating rewards.');
                }
                break;

            default:
                break;
        }
    }

    private mergeConfig(base: TierConfig, override: Partial<TierConfig>): TierConfig {
        return {
            ...base,
            quotas: { ...base.quotas, ...override.quotas },
            featureFlags: { ...base.featureFlags, ...override.featureFlags },
            progressBonuses: { ...base.progressBonuses, ...override.progressBonuses },
        };
    }

    private async checkCampaignLimit(userId: string, config: TierConfig, levelName?: string) {
        const baseLimit = config.quotas.maxActiveCampaigns;
        if (baseLimit === -1) return; // Unlimited

        let bonus = 0;
        if (levelName && config.progressBonuses) {
            const levelKey = levelName.toLowerCase().replace(/\s+/g, '_');
            const bonusKey = `${levelKey}_campaign_bonus`;
            if (config.progressBonuses[bonusKey]) {
                bonus = config.progressBonuses[bonusKey];
            }
        }

        const effectiveLimit = baseLimit + bonus;
        const currentUsage = await this.campaignService.countActiveCampaigns(userId);

        if (currentUsage >= effectiveLimit) {
            throw new ForbiddenException(
                `You have reached your limit of ${effectiveLimit} active campaigns. Upgrade or level up to unlock more.`
            );
        }
    }

    private async checkRewardLimit(campaignId: string, config: TierConfig) {
        if (!campaignId) return; // Should be provided for this check
        const limit = config.quotas.maxRewardsPerCampaign;
        const currentUsage = await this.campaignService.countRewards(campaignId);
        if (currentUsage >= limit) {
            throw new ForbiddenException(
                `You have reached the limit of ${limit} rewards per campaign.`
            );
        }
    }

    private checkRewardCountLimit(count: number, config: TierConfig) {
        const limit = config.quotas.maxRewardsPerCampaign;
        if (count > limit) {
            throw new ForbiddenException(
                `You have reached the limit of ${limit} rewards per campaign.`
            );
        }
    }

    private async checkRewardInventoryLimit(userId: string, config: TierConfig) {
        const limit = config.quotas.maxActiveRewards;
        if (limit === -1) return;

        const currentUsage = await this.rewardsService.countActiveBusinessRewards(userId);
        if (currentUsage >= limit) {
            throw new ForbiddenException(
                `You have reached your limit of ${limit} active rewards. Upgrade or level up to unlock more.`
            );
        }
    }
}
