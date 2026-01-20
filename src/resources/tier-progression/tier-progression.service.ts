import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
} from "@nestjs/common";
// Force re-compile
import { MembershipService } from "../membership/membership.service";
import { CampaignService } from "../campaign/campaign.service";
import { RewardsService } from "../rewards/services/rewards.service";
import { PointHistoryService } from "../analytics/services/point-history.service";
import { MembershipStatus } from "../membership/entities/membership.entity";
import {
  TierConfig,
  SeasonalTierConfig,
  ProgressionConditions,
  ProgressionLevelConfig,
} from "../tier/interfaces/tier-config.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Business } from "../business/entities/business.entity";
import { Repository } from "typeorm";
import { TierType } from "../tier/entities/tier-type.enum";

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
  ) {}

  async checkAndPromote(userId: string): Promise<void> {
    const membership = await this.membershipService.findOneByBusinessId(userId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      return;
    }

    // If Seasonal, no progression
    if (membership.tier.type === TierType.SEASONAL) {
      return;
    }

    const tierConfig = membership.tier.configuration;
    const currentLevel = membership.progression_level;

    // Get progression rules directly from standard config
    const proConfig = tierConfig.pro;
    const proPlusConfig = tierConfig.pro_plus;

    // Gather metrics
    const metrics = await this.getProgressionMetrics(
      userId,
      membership.starts_at,
    );

    // Check for promotion
    let newLevel = currentLevel;

    // Logic:
    // If Basic -> Check Pro
    // If Pro -> Check ProPlus

    // Check eligibility for Pro
    if (currentLevel === "basic" && proConfig) {
      if (this.evaluateConditions(metrics, proConfig.conditions)) {
        newLevel = "pro";
      }
    }

    // Check eligibility for Pro Plus (can jump from basic if eligible)
    if (proPlusConfig) {
      if (this.evaluateConditions(metrics, proPlusConfig.conditions)) {
        newLevel = "pro_plus";
      }
    }

    // If we are already Pro, we only check for Pro Plus.
    // But the logic above covers it: if basic, it checks pro, then checks pro_plus.
    // If pro_plus condition is met, it overrides 'pro'.
    // If current is 'pro', first block is skipped, second block checks pro_plus.

    if (newLevel !== currentLevel) {
      this.logger.log(
        `Promoting user ${userId} from ${currentLevel} to ${newLevel}`,
      );
      await this.membershipService.updateProgressionLevel(
        membership.id,
        newLevel,
      );
    }
  }

  async getDetailedProgression(userId: string) {
    const membership = await this.membershipService.findOneByBusinessId(userId);
    if (!membership) {
      throw new NotFoundException("Membership not found");
    }

    const tierConfig = membership.tier.configuration;
    const currentLevel = membership.progression_level || "basic";

    const metrics = await this.getProgressionMetrics(
      userId,
      membership.starts_at,
    );

    const nextLevels = [];

    const processLevel = (levelKey: string, config: ProgressionLevelConfig) => {
      if (!config) return;

      const requirements = [];
      const conditions = config.conditions;

      const addReq = (
        name: string,
        current: number | boolean,
        target: number | boolean,
        key: string,
      ) => {
        let remaining: any = 0;
        let isCompleted = false;

        if (typeof target === "number") {
          remaining = Math.max(0, target - (current as number));
          isCompleted = (current as number) >= target;
        } else if (typeof target === "boolean") {
          remaining = target && !current ? 1 : 0;
          isCompleted = current === target;
        }

        requirements.push({
          name,
          key,
          current,
          target,
          remaining,
          isCompleted,
        });
      };

      if (conditions.minCampaignsCreated) {
        addReq(
          "Campaigns Created",
          metrics.campaignsCreated,
          conditions.minCampaignsCreated,
          "minCampaignsCreated",
        );
      }
      if (conditions.minRewardsCreated) {
        addReq(
          "Rewards Created",
          metrics.rewardsCreated,
          conditions.minRewardsCreated,
          "minRewardsCreated",
        );
      }
      if (conditions.minPointsUsed) {
        addReq(
          "Points Used/Distributed",
          metrics.pointsUsed,
          conditions.minPointsUsed,
          "minPointsUsed",
        );
      }
      if (conditions.minPurchases) {
        // minPurchases -> participantJoins
        addReq(
          "Customer Joins (Purchases)",
          metrics.purchases,
          conditions.minPurchases,
          "minPurchases",
        );
      }
      if (conditions.minDaysActive) {
        addReq(
          "Days Active",
          metrics.daysActive,
          conditions.minDaysActive,
          "minDaysActive",
        );
      }
      if (conditions.profileCompleted) {
        addReq(
          "Profile Completed",
          metrics.profileCompleted,
          conditions.profileCompleted,
          "profileCompleted",
        );
      }

      nextLevels.push({
        level: levelKey,
        isCurrent: currentLevel === levelKey,
        requirements,
        benefits: config.benefits,
      });
    };

    // We show progress for Pro and Pro Plus
    if (tierConfig.pro) {
      processLevel("pro", tierConfig.pro);
    }
    if (tierConfig.pro_plus) {
      processLevel("pro_plus", tierConfig.pro_plus);
    }

    return {
      tierName: membership.tier.name,
      currentLevel,
      metrics,
      nextLevels: nextLevels.filter(
        (l) =>
          (currentLevel === "basic" &&
            (l.level === "pro" || l.level === "pro_plus")) ||
          (currentLevel === "pro" && l.level === "pro_plus"),
      ),
    };
  }

  private async getProgressionMetrics(
    userId: string,
    membershipStartDate: Date,
  ) {
    const [campaignsCreated, rewardsCreated, pointsUsed, participantJoins] =
      await Promise.all([
        this.campaignService.countTotalCampaigns(userId),
        this.rewardsService.countTotalRewards(userId),
        this.pointHistoryService.getTotalPointsUsed(userId),
        this.campaignService.countTotalParticipantJoins(userId),
      ]);

    // Calculate days active
    const daysActive = Math.floor(
      (Date.now() - new Date(membershipStartDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Check profile completion (ignore KYC)
    const business = await this.businessRepository.findOneBy({ id: userId });
    const profileCompleted = !!(
      business &&
      business.name &&
      business.email &&
      business.phone &&
      business.address
    );

    return {
      campaignsCreated,
      rewardsCreated,
      pointsUsed,
      customerScans: 0, // Ignored
      participants: 0, // Ignored
      purchases: participantJoins,
      tasksCompleted: 0, // Ignored
      daysActive,
      profileCompleted,
      kycVerified: false, // Ignored
      customerInteractions: 0,
      reviews: 0,
      redeemedRewards: 0,
      revenue: 0,
    };
  }

  private evaluateConditions(
    metrics: any,
    conditions: ProgressionConditions,
  ): boolean {
    if (
      conditions.minCampaignsCreated &&
      metrics.campaignsCreated < conditions.minCampaignsCreated
    )
      return false;
    if (
      conditions.minRewardsCreated &&
      metrics.rewardsCreated < conditions.minRewardsCreated
    )
      return false;
    if (
      conditions.minPointsUsed &&
      metrics.pointsUsed < conditions.minPointsUsed
    )
      return false;

    // Requirement 7: minPurchases uses metrics.purchases (which is participantJoins)
    if (conditions.minPurchases && metrics.purchases < conditions.minPurchases)
      return false;

    // Requirement 9: check days active
    if (
      conditions.minDaysActive &&
      metrics.daysActive < conditions.minDaysActive
    )
      return false;

    // Requirement 10: check profile completed
    if (conditions.profileCompleted && !metrics.profileCompleted) return false;

    // Ignore minCustomerScans and minTasksCompleted as per instructions 6 and 8.

    return true;
  }
}
