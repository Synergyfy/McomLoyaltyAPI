import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Reward } from './reward.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';

@Entity()
export class BusinessReward extends AbstractBaseEntity {
  @Column({ nullable: true })
  quantity: number;

  @Column()
  point_required: number;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}