import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Reward } from './reward.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { RewardType } from '../enums/reward-type.enum';
import { RewardSource } from '../enums/reward-source.enum';
import { RewardAudience } from '../enums/reward-audience.enum';
import { RewardStatus } from '../enums/reward-status.enum';

@Entity()
export class BusinessReward extends AbstractBaseEntity {
  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  remaining_quantity: number;

  @Column({ nullable: true })
  point_required: number;

  @Column({ nullable: true })
  stamp_required: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: RewardType })
  reward_type: RewardType;

  @Column({ type: 'enum', enum: RewardSource })
  reward_source: RewardSource;

  @Column({ type: 'enum', enum: RewardAudience })
  audience: RewardAudience;

  @Column({ type: 'timestamp', nullable: true })
  expiry_datetime: Date;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.ACTIVE,
  })
  status: RewardStatus;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column('text', { array: true, nullable: true })
  gallery: string[];

  @Column({ default: false })
  disabled: boolean;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Reward, { nullable: true })
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
