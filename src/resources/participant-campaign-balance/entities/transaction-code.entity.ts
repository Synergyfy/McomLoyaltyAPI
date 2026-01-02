import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Business } from "../../business/entities/business.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Reward } from "../../rewards/entities/reward.entity";
import { Participant } from "../../participant/entities/participant.entity";

export enum TransactionType {
  EARN = "EARN",
  REDEEM = "REDEEM",
  STAMP_EARN = "STAMP_EARN",
}

export enum TransactionCodeStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
}

@Entity("transaction_codes")
export class TransactionCode extends AbstractBaseEntity {
  @Column({ unique: true, length: 9 })
  code: string;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({
    type: "enum",
    enum: TransactionCodeStatus,
    default: TransactionCodeStatus.ACTIVE,
  })
  status: TransactionCodeStatus;

  @Column({ nullable: true, type: "int" })
  points: number;

  @Column({ nullable: true, type: "int" })
  stamps: number;

  @ManyToOne(() => Campaign, { nullable: true })
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  @ManyToOne(() => BusinessCampaign, { nullable: true })
  @JoinColumn({ name: "business_campaign_id" })
  businessCampaign: BusinessCampaign;

  @ManyToOne(() => Reward, { nullable: true })
  @JoinColumn({ name: "reward_id" })
  reward: Reward;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: "creator_business_id" })
  creator_business: Business;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: "creator_staff_id" })
  creator_staff: Staff;

  @ManyToOne(() => Participant, { nullable: true })
  @JoinColumn({ name: "used_by_participant_id" })
  used_by_participant: Participant;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({
    type: "varchar",
    nullable: true,
    default: "auto",
  })
  redemption_method: string;
}
