export interface TierConfig {
    quotas: {
        maxActiveCampaigns: number; // -1 for unlimited
        maxActiveRewards: number; // -1 for unlimited
        maxRewardsPerCampaign: number;
        monthlyPointsAllowance: number;
    };
    featureFlags: {
        canCreateCampaignFromScratch: boolean;
        canEditAdminTemplates: boolean;
        hasAccessToAdvancedAnalytics: boolean;
        hasAccessToCRM: boolean;
    };
    progressBonuses?: {
        [key: string]: number; // e.g., "pro_plus_campaign_bonus": 1
    };
}
