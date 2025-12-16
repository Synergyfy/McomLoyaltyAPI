import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { StampTriggerMethod } from '../enums/stamp-trigger-method.enum';
import { StampRewardType } from '../enums/stamp-reward-type.enum';

@Entity('stamp_reward_templates')
export class StampRewardTemplate extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  required_stamps: number;

  @Column({ type: 'enum', enum: StampRewardType })
  reward_benefit: StampRewardType;

  // Additional detail for the benefit (e.g., "10%" for discount, or "Coffee" for free item)
  @Column({ nullable: true })
  reward_benefit_value: string;

  @Column({ type: 'enum', enum: StampTriggerMethod })
  trigger_method: StampTriggerMethod;

  // Expiration settings
  @Column({ type: 'int', nullable: true, comment: 'Days valid after start' })
  stamp_validity_days: number;

  @Column({ type: 'int', nullable: true, comment: 'Days to redeem after completion' })
  reward_claim_deadline_days: number;

  // Hybrid Mode
  @Column({ default: false })
  is_hybrid: boolean;

  @Column({ type: 'int', default: 0 })
  hybrid_points_per_stamp: number;

  @Column({ type: 'int', default: 0 })
  hybrid_completion_bonus_points: number;

  // Visibility / System
  @Column({ default: false })
  is_published: boolean;

  // Default image that can be overridden by business
  @Column({ nullable: true })
  default_image: string;
}
