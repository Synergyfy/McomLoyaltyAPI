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
    enablePro?: boolean;
    enableProPlus?: boolean;
    pro?: Partial<TierConfig>;
    pro_plus?: Partial<TierConfig>;

    // Pricing overrides for variants
    monthly_price?: number;
    annual_price?: number;
    quaterly_price?: number;
    stripe_monthly_price_id?: string;
    stripe_quarterly_price_id?: string;
    stripe_annual_price_id?: string;
    paypal_monthly_plan_id?: string;
    paypal_quarterly_plan_id?: string;
    paypal_annual_plan_id?: string;
}
