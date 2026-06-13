import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Role } from "../../../common/role.enum";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import { ParticipantCampaignBalance } from "../../participant-campaign-balance/entities/participant-campaign-balance.entity";
import { DealRedemption } from "../../deal/entities/deal-redemption.entity";
import { DealReview } from "../../deal/entities/deal-review.entity";
import { ParticipantBadge } from "../../participant-progression/entities/participant-badge.entity";
import { Referral } from "../../referral/entities/referral.entity";

@Entity("participants")
export class Participant extends AbstractBaseEntity {
  otp?: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ type: "enum", enum: Role, default: Role.Participant })
  role: Role;

  @Column({ unique: true })
  uniqueCode: string;

  @ManyToMany(() => Campaign, (campaign) => campaign.participants)
  @JoinTable()
  campaigns: Campaign[];

  @ManyToMany(() => BusinessCampaign)
  @JoinTable()
  businessCampaigns: BusinessCampaign[];

  @OneToMany(
    () => ParticipantCampaignBalance,
    (participantCampaignBalance) => participantCampaignBalance.participant,
  )
  participantCampaignBalances: ParticipantCampaignBalance[];

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.participant)
  pointHistories: PointHistory[];

  @OneToMany(() => DealRedemption, (redemption) => redemption.user)
  dealRedemptions: DealRedemption[];

  @OneToMany(() => DealReview, (review) => review.user)
  dealReviews: DealReview[];

  @Column({ default: 0 })
  global_total_points: number;

  @Column({ default: 0 })
  matching_points: number;

  @ManyToOne(() => ParticipantBadge, { nullable: true })
  currentBadge: ParticipantBadge;

  @Column({ default: false })
  isDisabled: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ nullable: true, type: "date" })
  dob: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  profilePhoto: string;

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referrals: Referral[];

  // --- Streak & Activity Tracking ---
  @Column({ nullable: true })
  lastLoginDate: Date;

  @Column({ default: 0 })
  currentLoginStreak: number;

  @Column({ default: 0 })
  dailyAppOpenCount: number;

  @Column({ nullable: true })
  lastAppOpenDate: Date;
}
