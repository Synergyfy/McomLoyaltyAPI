import { Entity, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { TierStatus } from "./tier-status.enum";
import { TierConfig } from "../interfaces/tier-config.interface";
import { TierType } from "./tier-type.enum";
import { Season } from "../../season/entities/season.entity";
import { JoinColumn, ManyToOne } from "typeorm";

@Entity()
export class Tier extends AbstractBaseEntity {
  @ApiProperty({ description: "The unique name of the tier" })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: "The type of tier",
    enum: TierType,
    example: TierType.STANDARD,
  })
  @Column({
    type: "enum",
    enum: TierType,
    default: TierType.STANDARD,
  })
  type: TierType;

  @ApiProperty({
    description: "Color code",
    required: false,
    example: "#FF5733",
  })
  @Column({ nullable: true })
  color_code: string;

  @ApiProperty({
    description: "Fixed price for seasonal tier",
    required: false,
    example: 99.99,
  })
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  fixed_price: number;

  @ApiProperty({ description: "Monthly price", example: 49.99 })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  monthly_price: number;

  @ApiProperty({ description: "Annual price", example: 499.99 })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  annual_price: number;

  @ApiProperty({ description: "Quarterly price", example: 129.99 })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  quarterly_price: number;

  @ApiProperty({
    description: "List of features",
    example: ["Feature 1", "Feature 2"],
  })
  @Column("simple-array")
  features: string[];

  @ApiProperty({
    description: "Status of the tier",
    enum: TierStatus,
    example: TierStatus.PUBLISHED,
  })
  @Column({
    type: "enum",
    enum: TierStatus,
    default: TierStatus.DRAFT,
  })
  status: TierStatus;

  @ApiProperty({ description: "Stripe monthly price ID", required: false })
  @Column({ nullable: true })
  stripe_monthly_price_id: string;

  @ApiProperty({ description: "Stripe quarterly price ID", required: false })
  @Column({ nullable: true })
  stripe_quarterly_price_id: string;

  @ApiProperty({ description: "Stripe annual price ID", required: false })
  @Column({ nullable: true })
  stripe_annual_price_id: string;

  @ApiProperty({ description: "PayPal monthly plan ID", required: false })
  @Column({ nullable: true })
  paypal_monthly_plan_id: string;

  @ApiProperty({ description: "PayPal quarterly plan ID", required: false })
  @Column({ nullable: true })
  paypal_quarterly_plan_id: string;

  @ApiProperty({ description: "PayPal annual plan ID", required: false })
  @Column({ nullable: true })
  paypal_annual_plan_id: string;

  @ApiProperty({
    description: "Number of QR Code/Plaques included",
    default: 0,
  })
  @Column({ type: "int", default: 0 })
  qrCodeCount: number;

  @ApiProperty({
    description: "Configuration for the tier capabilities",
    required: false,
    example: {
      quotas: {
        maxActiveCampaigns: 5,
        maxActiveRewards: 10,
        maxRewardsPerCampaign: 3,
        monthlyPointsAllowance: 1000,
        monthlyStampsAllowance: 100,
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
  @Column({ type: "jsonb", nullable: true })
  configuration: TierConfig;

  @ApiProperty({
    description: "The season this tier is associated with",
    required: false,
    type: () => Season,
  })
  @ManyToOne(() => Season, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "season_id" })
  season: Season;

  @Column({ name: "season_id", nullable: true })
  season_id: string;
}
