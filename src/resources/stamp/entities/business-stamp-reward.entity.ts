import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { StampRewardTemplate } from './stamp-reward-template.entity';
import { Business } from '../../business/entities/business.entity';
import { StampCard } from './stamp-card.entity';

@Entity('business_stamp_rewards')
export class BusinessStampReward extends AbstractBaseEntity {
  /**
   * The admin template that this reward is based on.
   */
  @ManyToOne(() => StampRewardTemplate, { eager: true })
  template: StampRewardTemplate;

  /**
   * The business that offers this reward.
   */
  @ManyToOne(() => Business, { eager: false })
  business: Business;

  /**
   * Custom image uploaded by the business (overrides template default).
   */
  @Column({ nullable: true })
  custom_image: string;

  /**
   * Specific hours when this reward can be earned/redeemed (e.g., "Mon-Fri 9-5").
   */
  @Column({ nullable: true })
  operating_hours: string; // JSON string or text description

  /**
   * Whether the business has currently enabled this reward.
   */
  @Column({ default: true })
  is_active: boolean;

  // --- Analytics Counters (for efficiency) ---

  /**
   * Total number of unique stamp cards started for this reward.
   */
  @Column({ default: 0 })
  total_enrolled: number;

  /**
   * Total number of cards that reached the required stamp count.
   */
  @Column({ default: 0 })
  total_completions: number;

  /**
   * Total number of completed cards that were redeemed.
   */
  @Column({ default: 0 })
  total_redemptions: number;

  /**
   * The collection of stamp cards issued under this reward program.
   */
  @OneToMany(() => StampCard, (card) => card.businessStampReward)
  stampCards: StampCard[];
}
