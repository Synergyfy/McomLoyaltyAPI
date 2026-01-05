import { Entity, Column, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Reward } from "./reward.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { RewardType } from "../enums/reward-type.enum";
import { RewardSource } from "../enums/reward-source.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardStatus } from "../enums/reward-status.enum";

@Entity()
export class BusinessReward extends AbstractBaseEntity {
  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  remaining_quantity: number;

  @Column({ nullable: true })
  points_required: number;

  @Column({ nullable: true })
  stamps_required: number;

  @Column()
  title: string;

  @Column({ type: "enum", enum: RewardType })
  reward_type: RewardType;

  @Column({
    type: "enum",
    enum: RewardSource,
    default: RewardSource.BUSINESS,
  })
  reward_source: RewardSource;

  @Column({
    type: "enum",
    enum: RewardAudience,
    default: RewardAudience.ALL_BUSINESS,
  })
  audience: RewardAudience;

  @Column({ type: "timestamp", nullable: true })
  expiry_datetime: Date;

  @Column({
    type: "enum",
    enum: RewardStatus,
    default: RewardStatus.ACTIVE,
  })
  status: RewardStatus;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column("text", { array: true, nullable: true })
  gallery: string[];

  @Column({ default: true })
  is_points_enabled: boolean;

  @Column({ default: false })
  is_stamps_enabled: boolean;

  @Column({ nullable: true })
  stamp_emoji: string;

  @Column({ default: false })
  disabled: boolean;

  @Column({ default: false })
  is_mall_integrated: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  mall_reward_value: number;

  @Column({
    type: "enum",
    enum: ["VOUCHER", "GIFT_CARD", "COUPON"],
    default: "VOUCHER",
    nullable: true,
  })
  mall_reward_type: "VOUCHER" | "GIFT_CARD" | "COUPON";

  @ManyToOne(() => Business)
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Reward, { nullable: true })
  @JoinColumn({ name: "reward_id" })
  reward: Reward;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  @ManyToMany(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.businessRewards,
  )
  businessCampaigns?: BusinessCampaign[];

  total_redemptions?: number;
  total_points_redeemed?: number;
}
