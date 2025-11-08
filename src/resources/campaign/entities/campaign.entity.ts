import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PointHistory } from '../../participant-campaign-balance/entities/point-history.entity';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Reward } from '../../rewards/entities/reward.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../../participant-campaign-balance/entities/participant-campaign-balance.entity';

export enum CampaignType {
  QR_CODE = 'qr_code',
  REFERRAL = 'referral',
  SOCIAL_OR_EMAIL = 'social_or_email',
  SPECIAL_OCCASION = 'special_occasion',
}

export enum AudienceType {
  MEMBERS = 'members',
  BADGE_LEVEL = 'badge_level',
  TARGET_WISHLIST = 'target_wishlist',
}

@Entity('campaigns')
export class Campaign extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: CampaignType, default: CampaignType.QR_CODE })
  campaign_type: CampaignType;

  @Column('text')
  campaign_message: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  quantity: number;

  @Column({ type: 'enum', enum: AudienceType })
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

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'business_id' })
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

  @Column({ default: 0 })
  total_points_earned: number;

  @Column({ default: 0 })
  total_points_redeemed: number;
}