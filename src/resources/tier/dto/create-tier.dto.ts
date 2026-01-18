import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateIf,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { TierStatus } from "../entities/tier-status.enum";
import { TierConfig } from "../interfaces/tier-config.interface";
import { TierType } from "../entities/tier-type.enum";

export class CreateTierDto {
  @ApiProperty({
    description: "The name of the membership tier.",
    example: "Bronze",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "The type of the tier (standard or seasonal)",
    example: TierType.STANDARD,
    enum: TierType,
    default: TierType.STANDARD,
  })
  @IsOptional()
  @IsEnum(TierType)
  type: TierType;

  @ApiProperty({
    description: "Color code for the tier",
    example: "#FF5733",
  })
  @IsOptional()
  @IsString()
  color_code: string;

  @ApiProperty({
    description: "Fixed price for seasonal tier",
    example: 99.99,
  })
  @ValidateIf((o) => o.type === TierType.SEASONAL)
  @IsNotEmpty()
  @IsNumber()
  fixed_price: number;

  @ApiProperty({
    description: "The monthly price of the tier.",
    example: 45,
  })
  @IsNotEmpty()
  @ValidateIf((o) => !o.type || o.type === TierType.STANDARD)
  @IsNumber()
  monthly_price: number;

  @ApiProperty({
    description: "The annual price of the tier.",
    example: 540,
  })
  @IsNotEmpty()
  @ValidateIf((o) => !o.type || o.type === TierType.STANDARD)
  @IsNumber()
  annual_price: number;

  @ApiProperty({
    description: "The quarterly price of the tier.",
    example: 135,
  })
  @IsNotEmpty()
  @ValidateIf((o) => !o.type || o.type === TierType.STANDARD)
  @IsNumber()
  quarterly_price: number;

  @ApiProperty({
    description: "A list of features included in the tier.",
    example: ["Basic support", "10 QR codes"],
  })
  @IsNotEmpty()
  @IsArray()
  features: string[];

  @ApiProperty({
    description: "The status of the tier.",
    example: TierStatus.PUBLISHED,
    enum: TierStatus,
    default: TierStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(TierStatus)
  status: TierStatus;

  @ApiProperty({
    description: "Stripe Price ID for monthly subscription",
    required: false,
    example: "price_12345",
  })
  @IsOptional()
  @IsString()
  stripe_monthly_price_id?: string;

  @ApiProperty({
    description: "Stripe Price ID for quarterly subscription",
    required: false,
    example: "price_12345",
  })
  @IsOptional()
  @IsString()
  stripe_quarterly_price_id?: string;

  @ApiProperty({
    description: "Stripe Price ID for annual subscription",
    required: false,
    example: "price_12345",
  })
  @IsOptional()
  @IsString()
  stripe_annual_price_id?: string;

  @ApiProperty({
    description: "PayPal Plan ID for monthly subscription",
    required: false,
    example: "P-12345",
  })
  @IsOptional()
  @IsString()
  paypal_monthly_plan_id?: string;

  @ApiProperty({
    description: "PayPal Plan ID for quarterly subscription",
    required: false,
    example: "P-12345",
  })
  @IsOptional()
  @IsString()
  paypal_quarterly_plan_id?: string;

  @ApiProperty({
    description: "PayPal Plan ID for annual subscription",
    required: false,
    example: "P-12345",
  })
  @IsOptional()
  @IsString()
  paypal_annual_plan_id?: string;

  @ApiProperty({
    description: "Number of QR plaques included",
    required: false,
    default: 0,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  qrCodeCount?: number;

  @ApiProperty({
    description: "The ID of the season this tier belongs to",
    example: "uuid-of-season",
    required: false,
  })
  @ValidateIf((o) => o.type === TierType.SEASONAL)
  @IsNotEmpty()
  @IsString()
  season_id?: string;

  @ApiProperty({
    description: "Configuration for the tier capabilities",
    required: false,
    example: {
      quotas: {
        maxActiveCampaigns: 5,
        maxActiveRewards: 10,
        maxRewardsPerCampaign: 3,
        monthlyPointsAllowance: 1000,
        maxTeamMembers: 2,
      },
      featureFlags: {
        canCreateCampaignFromScratch: true,
        canEditAdminTemplates: false,
        hasAccessToAdvancedAnalytics: true,
        hasAccessToCRM: false,
        canUpdateReward: true,
      },
      progressBonuses: {
        active_campaign_bonus: 1,
      },
      pro: {
        conditions: {
          minCampaignsCreated: 2,
          minPointsUsed: 500,
        },
        benefits: {
          quotas: {
            maxActiveCampaigns: 6,
            maxRewardsPerCampaign: 4,
          },
          featureFlags: {
            canEditAdminTemplates: true,
          },
          bonusPoints: 500,
        },
      },
      pro_plus: {
        conditions: {
          minCampaignsCreated: 4,
          minCustomerInteractions: 80,
        },
        benefits: {
          quotas: {
            maxActiveCampaigns: 8,
            maxRewardsPerCampaign: 6,
          },
          featureFlags: {
            canCreateCampaignFromScratch: true,
          },
          unlockNextTierPreview: {
            percentNextTierPoints: 10,
            additionalTeamMembers: 1,
          },
        },
      },
      winter: {
        quotas: {
          maxActiveCampaigns: 10,
          maxActiveRewards: 20,
          maxRewardsPerCampaign: 5,
          monthlyPointsAllowance: 2000,
        },
        price: 59.99,
        stripe_price_id: "price_winter",
        pro: {
          conditions: { minCampaignsCreated: 3 },
          benefits: { quotas: { maxActiveCampaigns: 12 } },
        },
      },
      summer: {
        quotas: {
          maxActiveCampaigns: -1,
          maxActiveRewards: -1,
          maxRewardsPerCampaign: 10,
          monthlyPointsAllowance: 5000,
        },
        price: 99.99,
        stripe_price_id: "price_summer",
      },
      trial: {
        quotas: {
          maxActiveCampaigns: 2,
          maxActiveRewards: 5,
        },
        featureFlags: {
          canCreateCampaignFromScratch: false,
        },
      },
    },
  })
  @IsOptional()
  @IsObject()
  configuration?: TierConfig;
}
