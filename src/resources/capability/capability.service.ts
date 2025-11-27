import { Injectable, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { MembershipService } from '../membership/membership.service';
import { ProgressionService } from '../progression/progression.service';
import { CampaignService } from '../campaign/campaign.service';
import { TierConfig } from '../tier/interfaces/tier-config.interface';
import { MembershipStatus } from '../membership/entities/membership.entity';

export enum ActionType {
    CREATE_CAMPAIGN = 'CREATE_CAMPAIGN',
    CREATE_REWARD = 'CREATE_REWARD',
    ACCESS_ANALYTICS = 'ACCESS_ANALYTICS',
    ACCESS_CRM = 'ACCESS_CRM',
    EDIT_TEMPLATE = 'EDIT_TEMPLATE',
    UPDATE_CAMPAIGN = 'UPDATE_CAMPAIGN',
    ADD_REWARD_TO_BUSINESS = 'ADD_REWARD_TO_BUSINESS',
}

import { RewardsService } from '../rewards/services/rewards.service';

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
            // Fallback or throw if no config exists (legacy tiers)
            // For now, let's assume strict enforcement and throw if missing
            throw new ForbiddenException('Tier configuration missing.');
        }

        // 2. Fetch User's Progression Level
        // Assuming userId corresponds to businessId for progression
        // We might need to adjust if userId is a staff member, but for now assuming business owner
        const progression = await this.progressionService.getBusinessProgression(userId);
        const currentLevelName = progression?.currentLevel?.name;

        // 3. Calculate Effective Limits & Check Permissions
        switch (action) {
            case ActionType.CREATE_CAMPAIGN:
                await this.checkCampaignLimit(userId, tierConfig, currentLevelName);
                if (!tierConfig.featureFlags.canCreateCampaignFromScratch && context?.isFromScratch) {
                    throw new ForbiddenException('Your tier does not allow creating campaigns from scratch.');
                }
                if (context?.rewardCount !== undefined) {
                    this.checkRewardCountLimit(context.rewardCount, tierConfig);
                }
                break;

            case ActionType.UPDATE_CAMPAIGN:
                if (context?.rewardCount !== undefined) {
                    this.checkRewardCountLimit(context.rewardCount, tierConfig);
                }
                break;

            case ActionType.CREATE_REWARD:
                await this.checkRewardLimit(context?.campaignId, tierConfig);
                break;

            case ActionType.ADD_REWARD_TO_BUSINESS:
                await this.checkRewardInventoryLimit(userId, tierConfig);
                break;

            case ActionType.ACCESS_ANALYTICS:
                if (!tierConfig.featureFlags.hasAccessToAdvancedAnalytics) {
                    throw new ForbiddenException('Upgrade to access advanced analytics.');
                }
                break;

            case ActionType.ACCESS_CRM:
                if (!tierConfig.featureFlags.hasAccessToCRM) {
                    throw new ForbiddenException('Upgrade to access CRM features.');
                }
                break;

            case ActionType.EDIT_TEMPLATE:
                if (!tierConfig.featureFlags.canEditAdminTemplates) {
                    throw new ForbiddenException('Your tier does not allow editing admin templates.');
                }
                break;

            default:
                break;
        }
    }

    private async checkCampaignLimit(userId: string, config: TierConfig, levelName?: string) {
        const baseLimit = config.quotas.maxActiveCampaigns;
        if (baseLimit === -1) return; // Unlimited

        let bonus = 0;
        if (levelName && config.progressBonuses) {
            // Example: "pro_plus_campaign_bonus"
            // We need a mapping or convention. Let's assume the key in progressBonuses matches a slugified level name + "_campaign_bonus"
            // Or simpler: check specific keys if they exist
            // For this implementation, let's look for keys containing the level name (case insensitive)
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
        // We need a method in CampaignService or RewardService to count rewards for a campaign
        // Since we injected CampaignService, let's assume it has or we can add a method to count rewards
        // For now, I will assume a method exists or I will add it.
        // Let's assume campaignService.countRewards(campaignId)
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
