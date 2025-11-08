import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Business } from '../../business/entities/business.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Reward } from '../../rewards/entities/reward.entity';

export enum PointHistoryType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
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

  @ManyToOne(() => Campaign, (campaign) => campaign.pointHistories)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

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
}