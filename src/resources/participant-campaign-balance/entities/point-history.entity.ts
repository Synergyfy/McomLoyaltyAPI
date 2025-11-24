import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';
import { Business } from '../../business/entities/business.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Reward } from '../../rewards/entities/reward.entity';

export enum PointHistoryType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  MATCHING = 'MATCHING',
}

@Entity('point_histories')
export class PointHistory extends AbstractBaseEntity {
  @Column({ type: 'enum', enum: PointHistoryType })
  type: PointHistoryType;

  @Column()
  points: number;

  @ManyToOne(() => Participant, (participant) => participant.pointHistories)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @ManyToOne(() => Campaign, (campaign) => campaign.pointHistories, { nullable: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @ManyToOne(() => BusinessCampaign, (businessCampaign) => businessCampaign.pointHistories, { nullable: true })
  @JoinColumn({ name: 'business_campaign_id' })
  businessCampaign: BusinessCampaign;

  @ManyToOne(() => Reward, { nullable: true })
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'initiated_by_staff_id' })
  initiated_by_staff: Staff;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ nullable: true })
  redemption_code: string;

  @Column({ nullable: true })
  description: string;
}