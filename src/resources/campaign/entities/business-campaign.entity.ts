import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Campaign } from "./campaign.entity";
import { ParticipantCampaignBalance } from "../../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { BusinessReward } from "../../rewards/entities/business-reward.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import {
  CampaignRewardMode,
  CampaignType,
  AudienceType,
} from "./campaign-enums";
import { WishlistAggregate } from "../../wishlist/entities/wishlist-aggregate.entity";
import { Deal } from "../../deal/entities/deal.entity";

@Entity("business_campaigns")
export class BusinessCampaign extends AbstractBaseEntity {
  @ManyToOne(() => Business, (business) => business.campaigns)
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Campaign, (campaign) => campaign.businessCampaigns)
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  @ManyToOne(() => WishlistAggregate, { nullable: true })
  @JoinColumn({ name: "wishlist_aggregate_id" })
  wishlistAggregate: WishlistAggregate;

  @Column({ default: false })
  disabled: boolean;

  @Column({ unique: true, nullable: true })
  uniqueCode: string;

  @OneToMany(
    () => ParticipantCampaignBalance,
    (balance) => balance.businessCampaign,
  )
  participantCampaignBalances: ParticipantCampaignBalance[];

  @ManyToMany(() => BusinessReward, (reward) => reward.businessCampaigns)
  @JoinTable({
    name: "business_campaign_rewards",
    joinColumn: { name: "business_campaign_id", referencedColumnName: "id" },
    inverseJoinColumn: {
      name: "business_reward_id",
      referencedColumnName: "id",
    },
  })
  businessRewards: BusinessReward[];

  @ManyToMany(() => Deal, (deal) => deal.businessCampaigns)
  @JoinTable({
    name: "business_campaign_deals",
    joinColumn: { name: "business_campaign_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "deal_id", referencedColumnName: "id" },
  })
  deals: Deal[];

  @ManyToMany(() => Business, (business) => business.joinedCampaigns)
  @JoinTable({
    name: "business_campaign_participants",
    joinColumn: { name: "business_campaign_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "business_id", referencedColumnName: "id" },
  })
  participatingBusinesses: Business[];

  @OneToMany(
    () => PointHistory,
    (pointHistory) => pointHistory.businessCampaign,
  )
  pointHistories: PointHistory[];

  // --- Campaign Override Fields ---

  @Column({ nullable: true })
  name: string;

  @Column({
    type: "enum",
    enum: CampaignType,
    default: CampaignType.QR_CODE,
  })
  campaign_type: CampaignType;

  @Column({ nullable: true })
  campaign_message: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ type: "timestamp", nullable: true })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @Column({
    type: "enum",
    enum: AudienceType,
    default: AudienceType.ALL,
  })
  audience_type: AudienceType;

  @Column({ nullable: true })
  banner_url: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ type: "int", default: 0 })
  signUpPoint: number;

  @Column({ type: "int", default: 0 })
  initial_audience_size: number;

  @Column({
    type: "enum",
    enum: CampaignRewardMode,
    default: CampaignRewardMode.POINTS,
  })
  reward_mode: CampaignRewardMode;

  @Column({ nullable: true })
  regular_points_ratio: string;

  @Column({ type: "int", nullable: true })
  regular_points_threshold: number;

  @Column({ default: 0, type: "int" })
  total_points_earned: number;

  @Column({ default: 0, type: "int" })
  total_points_redeemed: number;

  @Column({ nullable: true })
  terms_and_conditions: string;

  @Column({ default: true })
  is_public: boolean;

  @Column({ nullable: true })
  earn_point_page_title: string;

  @Column({ nullable: true })
  earn_point_page_description: string;

  @Column({ nullable: true })
  redeem_reward_page_title: string;

  @Column({ nullable: true })
  redeem_reward_page_description: string;

  @Column({ nullable: true })
  contact_us_page_title: string;

  @Column({ nullable: true })
  contact_us_page_description: string;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ nullable: true })
  contact_phone_number: string;

  @Column({ nullable: true })
  footer_text: string;

  @Column({ type: "int", nullable: true })
  total_slots: number;

  @Column({ type: "int", nullable: true })
  remaining_slots: number;
}
