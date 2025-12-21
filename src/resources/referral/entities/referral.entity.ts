import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { Business } from "../../business/entities/business.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";

export enum ReferralStatus {
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
}

@Entity("referrals")
export class Referral extends AbstractBaseEntity {
  @Column()
  refereeEmail: string;

  @Column({
    type: "enum",
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @Column({ default: 0 })
  pointsEarned: number;

  // The person who sent the invite
  @ManyToOne(() => Participant, (participant) => participant.referrals, {
    nullable: true,
  })
  @JoinColumn({ name: "referrer_id" })
  referrer: Participant;

  @ManyToOne(() => Business, (business) => business.referrals, {
    nullable: true,
  })
  @JoinColumn({ name: "referrer_business_id" })
  referrerBusiness: Business;

  // The person who was invited (linked after they sign up)
  @OneToOne(() => Participant, { nullable: true })
  @JoinColumn({ name: "referee_id" })
  referee: Participant;

  @OneToOne(() => Business, { nullable: true })
  @JoinColumn({ name: "referee_business_id" })
  refereeBusiness: Business;

  // Optional: The campaign context of the invite
  @ManyToOne(() => Campaign, { nullable: true })
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  // The code used (could be the referrer's unique code or a generated one)
  @Column()
  code: string;
}
