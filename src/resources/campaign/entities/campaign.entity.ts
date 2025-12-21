import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { ParticipantCampaignBalance } from "../../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { BusinessCampaign } from "./business-campaign.entity";
import {
  CampaignType,
  AudienceType,
  RewardType,
  CampaignRewardMode,
} from "./campaign-enums";
import { WishlistAggregate } from "../../wishlist/entities/wishlist-aggregate.entity";
import { Tier } from "../../tier/entities/tier.entity";
import { Deal } from "../../deal/entities/deal.entity";

@Entity("campaigns")
export class Campaign extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: "enum", enum: CampaignType, default: CampaignType.QR_CODE })
  campaign_type: CampaignType;

  @Column("text")
  campaign_message: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  quantity: number;

  @Column({ type: "enum", enum: AudienceType })
  audience_type: AudienceType;

  @Column()
  banner_url: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column()
  cta_text: string;

  @Column()
  cta_background_color: string;

  @Column()
  cta_text_color: string;

  @ManyToMany(() => Reward)
  @JoinTable()
  rewards: Reward[];

  @ManyToMany(() => Deal, (deal) => deal.campaigns)
  @JoinTable()
  deals: Deal[];

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @Column({ default: false })
  disabled: boolean;

  @Column()
  text_color: string;

  @Column()
  background_color: string;

  @Column({ nullable: true })
  signUpPoint: number;

  @ManyToMany(() => Participant, (participant) => participant.campaigns)
  participants: Participant[];

  @OneToMany(
    () => ParticipantCampaignBalance,
    (participantCampaignBalance) => participantCampaignBalance.campaign,
  )
  participantCampaignBalances: ParticipantCampaignBalance[];

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.campaign)
  pointHistories: PointHistory[];

  @OneToMany(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.campaign,
  )
  businessCampaigns: BusinessCampaign[];

  @Column({ default: 0 })
  total_points_earned: number;

  @Column({ default: 0 })
  total_points_redeemed: number;

  @Column({
    type: "enum",
    enum: RewardType,
    default: RewardType.REGULAR,
  })
  reward_type: RewardType;

  @Column({
    type: "enum",
    enum: CampaignRewardMode,
    default: CampaignRewardMode.POINTS,
  })
  reward_mode: CampaignRewardMode;

  @Column({ type: "int", nullable: true })
  regular_points_threshold: number;

  @Column({ type: "int", nullable: true })
  matching_points_threshold: number;

  @Column({ default: 0 })
  total_matching_points_earned: number;

  @Column({ default: false })
  matching_points_disabled_by_admin: boolean;

  @Column({ nullable: true, length: 9, unique: true })
  uniqueCode: string;

  @Column({ nullable: true })
  earn_point_page_title: string;

  @Column({ type: "text", nullable: true })
  earn_point_page_description: string;

  @Column({ nullable: true })
  redeem_reward_page_title: string;

  @Column({ type: "text", nullable: true })
  redeem_reward_page_description: string;

  @Column({ nullable: true })
  contact_us_page_title: string;

  @Column({ type: "text", nullable: true })
  contact_us_page_description: string;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ nullable: true })
  contact_phone_number: string;

  @Column({ nullable: true })
  footer_text: string;

  @ManyToOne(() => WishlistAggregate, { nullable: true })
  @JoinColumn({ name: "wishlist_aggregate_id" })
  wishlistAggregate: WishlistAggregate;

  @Column({ type: "int", nullable: true })
  initial_audience_size: number;

  @ManyToOne(() => Tier, { nullable: true })
  @JoinColumn({ name: "target_tier_id" })
  targetTier: Tier;
}
