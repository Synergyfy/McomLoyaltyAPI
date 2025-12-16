import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { StampRewardTemplate } from './stamp-reward-template.entity';
import { Business } from '../../business/entities/business.entity';
import { StampCard } from './stamp-card.entity';

@Entity('business_stamp_rewards')
export class BusinessStampReward extends AbstractBaseEntity {
  @ManyToOne(() => StampRewardTemplate, { eager: true })
  template: StampRewardTemplate;

  @ManyToOne(() => Business, { eager: false })
  business: Business;

  @Column({ nullable: true })
  custom_image: string;

  @Column({ nullable: true })
  operating_hours: string; // JSON string or text description

  @Column({ default: true })
  is_active: boolean;

  // Track stats directly on entity for quick access, or calculate dynamically.
  // Using simple counters here for efficiency as per "fast and efficient code" requirement.
  @Column({ default: 0 })
  total_enrolled: number;

  @Column({ default: 0 })
  total_completions: number;

  @Column({ default: 0 })
  total_redemptions: number;

  @OneToMany(() => StampCard, (card) => card.businessStampReward)
  stampCards: StampCard[];
}
