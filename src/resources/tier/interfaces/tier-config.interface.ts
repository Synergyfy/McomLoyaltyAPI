export interface TierQuotas {
  maxActiveCampaigns: number; // -1 for unlimited
  maxActiveRewards: number; // -1 for unlimited
  maxRewardsPerCampaign: number;
  monthlyPointsAllowance: number;
  monthlyStampsAllowance: number;
  monthlyRewardBudget: number; // GBP Amount allocated to the business per month
  maxTeamMembers: number; // -1 for unlimited
  maxRewardPoints: number;
}

export interface TierFeatureFlags {
  canCreateCampaignFromScratch: boolean;
  canEditAdminTemplates: boolean;
  hasAccessToAdvancedAnalytics: boolean;
  hasAccessToCRM: boolean;
  canUpdateReward: boolean;
  canCreateRewardFromScratch: boolean;
}

export interface ProgressionConditions {
  minCampaignsCreated?: number;
  minRewardsCreated?: number;
  minPointsUsed?: number;
  minCustomerScans?: number;
  minParticipants?: number;
  minTasksCompleted?: number;
  minPurchases?: number;
  minDaysActive?: number;
  profileCompleted?: boolean;
  kycVerified?: boolean;
  minCustomerInteractions?: number;
  minReviews?: number;
  minRedeemedRewards?: number;
  minRevenue?: number;
}

export interface SmartMoneyConfig {
  maxDurationDays: number;
  maxContributionAmount: number;
  minMembers: number;
  maxMembers: number;
}

export interface ProgressionBenefits {
  quotas?: Partial<TierQuotas>;
  featureFlags?: Partial<TierFeatureFlags>;
  bonusPoints?: number;
  unlockNextTierPreview?: {
    percentNextTierPoints?: number;
    additionalTeamMembers?: number;
    analytics?: boolean;
    segmentation?: boolean;
  };
}

export interface ProgressionLevelConfig {
  conditions: ProgressionConditions;
  benefits: ProgressionBenefits;
}

export interface SeasonalTierConfig {
  price: number;
  stripe_price_id?: string;
  paypal_plan_id?: string;
  quotas?: Partial<TierQuotas>;
  featureFlags?: Partial<TierFeatureFlags>;
  progressBonuses?: {
    [key: string]: number;
  };
  pro?: ProgressionLevelConfig;
  pro_plus?: ProgressionLevelConfig;
}

export interface TrialTierConfig {
  quotas?: Partial<TierQuotas>;
  featureFlags?: Partial<TierFeatureFlags>;
  progressBonuses?: {
    [key: string]: number;
  };
}

export interface TierConfig {
  quotas: TierQuotas;
  featureFlags: TierFeatureFlags;
  progressBonuses?: {
    [key: string]: number; // e.g., "active_campaign_bonus": 1
  };

  // Progression Levels
  pro?: ProgressionLevelConfig;
  pro_plus?: ProgressionLevelConfig;

  // Seasonal Variants removed

  // Trial Configuration
  trial?: TrialTierConfig;

  // Smart Money Configuration
  smartMoney?: SmartMoneyConfig;

  // Pricing overrides for variants
  monthly_price?: number;
  annual_price?: number;
  quarterly_price?: number;
  stripe_monthly_price_id?: string;
  stripe_quarterly_price_id?: string;
  stripe_annual_price_id?: string;
  paypal_monthly_plan_id?: string;
  paypal_quarterly_plan_id?: string;
  paypal_annual_plan_id?: string;
}
