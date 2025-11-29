import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TierStatus } from '../entities/tier-status.enum';
import { TierConfig } from '../interfaces/tier-config.interface';

export class CreateTierDto {
  @ApiProperty({
    description: 'The name of the membership tier.',
    example: 'Bronze',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The monthly price of the tier.',
    example: 45,
  })
  @IsNotEmpty()
  @IsNumber()
  monthly_price: number;

  @ApiProperty({
    description: 'The annual price of the tier.',
    example: 540,
  })
  @IsNotEmpty()
  @IsNumber()
  annual_price: number;

  @ApiProperty({
    description: 'The quarterly price of the tier.',
    example: 135,
  })
  @IsNotEmpty()
  @IsNumber()
  quaterly_price: number;

  @ApiProperty({
    description: 'A list of features included in the tier.',
    example: ['Basic support', '10 QR codes'],
  })
  @IsNotEmpty()
  @IsArray()
  features: string[];

  @ApiProperty({
    description: 'The status of the tier.',
    example: TierStatus.PUBLISHED,
    enum: TierStatus,
    default: TierStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(TierStatus)
  status: TierStatus;

  @ApiProperty({
    description: 'Stripe Price ID for monthly subscription',
    required: false,
    example: 'price_12345',
  })
  @IsOptional()
  @IsString()
  stripe_monthly_price_id?: string;

  @ApiProperty({
    description: 'Stripe Price ID for quarterly subscription',
    required: false,
    example: 'price_12345',
  })
  @IsOptional()
  @IsString()
  stripe_quarterly_price_id?: string;

  @ApiProperty({
    description: 'Stripe Price ID for annual subscription',
    required: false,
    example: 'price_12345',
  })
  @IsOptional()
  @IsString()
  stripe_annual_price_id?: string;

  @ApiProperty({
    description: 'PayPal Plan ID for monthly subscription',
    required: false,
    example: 'P-12345',
  })
  @IsOptional()
  @IsString()
  paypal_monthly_plan_id?: string;

  @ApiProperty({
    description: 'PayPal Plan ID for quarterly subscription',
    required: false,
    example: 'P-12345',
  })
  @IsOptional()
  @IsString()
  paypal_quarterly_plan_id?: string;

  @ApiProperty({
    description: 'PayPal Plan ID for annual subscription',
    required: false,
    example: 'P-12345',
  })
  @IsOptional()
  @IsString()
  paypal_annual_plan_id?: string;

  @ApiProperty({
    description: 'Number of QR plaques included',
    required: false,
    default: 0,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  qrCodeCount?: number;

  @ApiProperty({
    description: 'Configuration for the tier capabilities',
    required: false,
    example: {
      quotas: {
        maxActiveCampaigns: 5,
        maxActiveRewards: 10,
        maxRewardsPerCampaign: 3,
        monthlyPointsAllowance: 1000,
      },
      featureFlags: {
        canCreateCampaignFromScratch: true,
        canEditAdminTemplates: false,
        hasAccessToAdvancedAnalytics: true,
        hasAccessToCRM: false,
        canUpdateReward: true,
      },
      progressBonuses: {
        pro_plus_campaign_bonus: 1,
      },
      enablePro: true,
      pro: {
        quotas: {
          maxActiveCampaigns: 10,
          maxActiveRewards: 20,
          maxRewardsPerCampaign: 5,
          monthlyPointsAllowance: 2000,
        },
        monthly_price: 59.99,
        annual_price: 600.00,
        stripe_monthly_price_id: 'price_pro_monthly',
      },
      enableProPlus: true,
      pro_plus: {
        quotas: {
          maxActiveCampaigns: -1,
          maxActiveRewards: -1,
          maxRewardsPerCampaign: 10,
          monthlyPointsAllowance: 5000,
        },
        monthly_price: 99.99,
        annual_price: 1000.00,
        stripe_monthly_price_id: 'price_pro_plus_monthly',
      },
    },
  })
  @IsOptional()
  @IsObject()
  configuration?: TierConfig;
}
