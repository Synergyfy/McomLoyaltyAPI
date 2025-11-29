import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
// Force re-compile
import { MembershipService } from '../membership/membership.service';
import { CampaignService } from '../campaign/campaign.service';
import { RewardsService } from '../rewards/services/rewards.service';
import { PointHistoryService } from '../analytics/services/point-history.service';
import { MembershipStatus } from '../membership/entities/membership.entity';
import { TierConfig, SeasonalTierConfig, ProgressionConditions } from '../tier/interfaces/tier-config.interface';

@Injectable()
export class TierProgressionService {
    private readonly logger = new Logger(TierProgressionService.name);

    constructor(
        private readonly membershipService: MembershipService,
        @Inject(forwardRef(() => CampaignService))
        private readonly campaignService: CampaignService,
        private readonly rewardsService: RewardsService,
        private readonly pointHistoryService: PointHistoryService,
    ) { }

    async checkAndPromote(userId: string): Promise<void> {
        const membership = await this.membershipService.findOneByUserId(userId);
        if (!membership || membership.status !== MembershipStatus.ACTIVE) {
            return;
        }

        const tierConfig = membership.tier.configuration;
        const variant = membership.variant;
        const currentLevel = membership.progression_level;

        // Determine effective seasonal config
        let seasonalConfig: SeasonalTierConfig | undefined;
        if (variant === 'winter' && tierConfig.winter) seasonalConfig = tierConfig.winter;
        else if (variant === 'summer' && tierConfig.summer) seasonalConfig = tierConfig.summer;
        else if (variant === 'autumn' && tierConfig.autumn) seasonalConfig = tierConfig.autumn;
        else if (variant === 'spring' && tierConfig.spring) seasonalConfig = tierConfig.spring;

        // Get progression rules
        const proConfig = seasonalConfig?.pro || tierConfig.pro;
        const proPlusConfig = seasonalConfig?.pro_plus || tierConfig.pro_plus;

        // Gather metrics
        const metrics = await this.getProgressionMetrics(userId);

        // Check for promotion
        let newLevel = currentLevel;

        // Logic:
        // If Basic -> Check Pro
        // If Pro -> Check ProPlus
        // Note: If user qualifies for ProPlus directly from Basic, we should probably promote them all the way.

        if (currentLevel === 'basic') {
            if (proConfig && this.evaluateConditions(metrics, proConfig.conditions)) {
                newLevel = 'pro';
                this.logger.log(`User ${userId} promoted to PRO`);
            }
        }

        if (newLevel === 'pro' || currentLevel === 'pro') {
            if (proPlusConfig && this.evaluateConditions(metrics, proPlusConfig.conditions)) {
                newLevel = 'pro_plus';
                this.logger.log(`User ${userId} promoted to PRO_PLUS`);
            }
        }

        if (newLevel !== currentLevel) {
            await this.membershipService.updateProgressionLevel(membership.id, newLevel);
        }
    }

    private async getProgressionMetrics(userId: string) {
        const [
            campaignsCreated,
            rewardsCreated,
            pointsUsed
        ] = await Promise.all([
            this.campaignService.countTotalCampaigns(userId),
            this.rewardsService.countTotalRewards(userId),
            this.pointHistoryService.getTotalPointsUsed(userId)
        ]);

        // Note: Other metrics like 'minCustomerScans', 'minParticipants' would need additional service methods
        // For now, implementing the core ones available.

        return {
            campaignsCreated,
            rewardsCreated,
            pointsUsed,
            // placeholders for others
            customerScans: 0,
            participants: 0,
            tasksCompleted: 0,
            purchases: 0,
            daysActive: 0, // Calculate from membership start date
            profileCompleted: false,
            kycVerified: false,
            customerInteractions: 0,
            reviews: 0,
            redeemedRewards: 0,
            revenue: 0
        };
    }

    private evaluateConditions(metrics: any, conditions: ProgressionConditions): boolean {
        if (conditions.minCampaignsCreated && metrics.campaignsCreated < conditions.minCampaignsCreated) return false;
        if (conditions.minRewardsCreated && metrics.rewardsCreated < conditions.minRewardsCreated) return false;
        if (conditions.minPointsUsed && metrics.pointsUsed < conditions.minPointsUsed) return false;

        // Add checks for other conditions as metrics become available

        return true;
    }
}
