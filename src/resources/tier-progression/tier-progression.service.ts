import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
// Force re-compile
import { MembershipService } from '../membership/membership.service';
import { CampaignService } from '../campaign/campaign.service';
import { RewardsService } from '../rewards/services/rewards.service';
import { PointHistoryService } from '../analytics/services/point-history.service';
import { MembershipStatus } from '../membership/entities/membership.entity';
import { TierConfig, SeasonalTierConfig, ProgressionConditions } from '../tier/interfaces/tier-config.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TierProgressionService {
    private readonly logger = new Logger(TierProgressionService.name);

    constructor(
        private readonly membershipService: MembershipService,
        @Inject(forwardRef(() => CampaignService))
        private readonly campaignService: CampaignService,
        @Inject(forwardRef(() => RewardsService))
        private readonly rewardsService: RewardsService,
        private readonly pointHistoryService: PointHistoryService,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
    ) { }

    async checkAndPromote(userId: string): Promise<void> {
        const membership = await this.membershipService.findOneByBusinessId(userId);
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
        const metrics = await this.getProgressionMetrics(userId, membership.starts_at);

        // Check for promotion
        let newLevel = currentLevel;

        // Logic:
        // If Basic -> Check Pro
        // If Pro -> Check ProPlus

        // Check eligibility for Pro
        if (currentLevel === 'basic' && proConfig) {
            if (this.evaluateConditions(metrics, proConfig.conditions)) {
                newLevel = 'pro';
            }
        }

        // Check eligibility for Pro Plus (can jump from basic if eligible)
        if (proPlusConfig) {
            if (this.evaluateConditions(metrics, proPlusConfig.conditions)) {
                newLevel = 'pro_plus';
            }
        }

        // If we are already Pro, we only check for Pro Plus. 
        // But the logic above covers it: if basic, it checks pro, then checks pro_plus. 
        // If pro_plus condition is met, it overrides 'pro'.
        // If current is 'pro', first block is skipped, second block checks pro_plus.

        if (newLevel !== currentLevel) {
            this.logger.log(`Promoting user ${userId} from ${currentLevel} to ${newLevel}`);
            await this.membershipService.updateProgressionLevel(membership.id, newLevel);
        }
    }

    private async getProgressionMetrics(userId: string, membershipStartDate: Date) {
        const [
            campaignsCreated,
            rewardsCreated,
            pointsUsed,
            participantJoins
        ] = await Promise.all([
            this.campaignService.countTotalCampaigns(userId),
            this.rewardsService.countTotalRewards(userId),
            this.pointHistoryService.getTotalPointsUsed(userId),
            this.campaignService.countTotalParticipantJoins(userId)
        ]);

        // Calculate days active
        const daysActive = Math.floor((Date.now() - new Date(membershipStartDate).getTime()) / (1000 * 60 * 60 * 24));

        // Check profile completion (ignore KYC)
        const business = await this.businessRepository.findOneBy({ id: userId });
        const profileCompleted = !!(
            business &&
            business.name &&
            business.email &&
            business.phone &&
            business.address &&
            business.website // Assuming website is part of "complete" profile, or maybe optional?
            // Requirement says "check if profile is completed". Usually implies mandatory fields + some optional.
            // I'll assume name, email, phone, address are core. Website might be optional.
            // Let's check if website is nullable in entity. Yes it is.
            // But for "completed" profile, maybe it should be filled?
            // I'll stick to name, email, phone, address for now as "completed".
            // Actually, let's include website if it's considered part of "profile completion" metrics usually.
            // But to be safe and not block promotion too hard, I'll stick to core contact info.
        );

        // For now, let's assume I can access it. I'll add the repository to constructor in a separate edit if needed, 
        // or use what I have. I don't have Business access here yet.

        // Let's return placeholders for now and I will add BusinessRepository injection in next step.

        return {
            campaignsCreated,
            rewardsCreated,
            pointsUsed,
            customerScans: 0, // Ignored
            participants: 0, // Ignored or mapped? "minParticipants" -> maybe participantJoins?
            // Requirement 7: "use the number of times a participant ... as the number of purchanges. so use that to compare minPurchases"
            purchases: participantJoins,
            tasksCompleted: 0, // Ignored
            daysActive,
            profileCompleted,
            kycVerified: false, // Ignored
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

        // Requirement 7: minPurchases uses metrics.purchases (which is participantJoins)
        if (conditions.minPurchases && metrics.purchases < conditions.minPurchases) return false;

        // Requirement 9: check days active
        if (conditions.minDaysActive && metrics.daysActive < conditions.minDaysActive) return false;

        // Requirement 10: check profile completed
        if (conditions.profileCompleted && !metrics.profileCompleted) return false;

        // Ignore minCustomerScans and minTasksCompleted as per instructions 6 and 8.

        return true;
    }
}
