import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Business } from "../../business/entities/business.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import { BusinessReward } from "../../rewards/entities/business-reward.entity";
import { Deal } from "../../deal/entities/deal.entity";

export enum PointHistoryType {
  EARN = "EARN",
  REDEEM = "REDEEM",
  PURCHASED_EXTRA = "PURCHASED_EXTRA",
  STAMP_EARN = "STAMP_EARN",
  STAMP_REDEEM = "STAMP_REDEEM",
  BUSINESS_STAMP_SPENT = "BUSINESS_STAMP_SPENT",
}

@Entity("point_histories")
export class PointHistory extends AbstractBaseEntity {
  @Column({ type: "enum", enum: PointHistoryType })
  type: PointHistoryType;

  @Column({ default: 0 })
  points: number;

  @Column({ nullable: true })
  stamps: number;

  @ManyToOne(() => Participant, (participant) => participant.pointHistories, {
    nullable: true,
  })
  @JoinColumn({ name: "participant_id" })
  participant: Participant;

  @ManyToOne(() => Campaign, (campaign) => campaign.pointHistories, {
    nullable: true,
  })
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  @ManyToOne(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.pointHistories,
    { nullable: true },
  )
  @JoinColumn({ name: "business_campaign_id" })
  businessCampaign: BusinessCampaign;

  @ManyToOne(() => Reward, { nullable: true })
  @JoinColumn({ name: "reward_id" })
  reward: Reward;

  @ManyToOne(() => BusinessReward, { nullable: true })
  @JoinColumn({ name: "business_reward_id" })
  businessReward: BusinessReward;

  @ManyToOne(() => Deal, { nullable: true })
  @JoinColumn({ name: "deal_id" })
  deal: Deal;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: "initiated_by_staff_id" })
  initiated_by_staff: Staff;

  @ManyToOne(() => Business)
  @JoinColumn({ name: "business_id" })
  business: Business;

  @Column({ nullable: true })
  actionKey: string;

  @Column({ nullable: true })
  redemption_code: string;

  @Column({ nullable: true })
  description: string;
}
