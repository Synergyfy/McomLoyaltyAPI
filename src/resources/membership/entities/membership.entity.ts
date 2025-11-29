import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Tier } from '../../tier/entities/tier.entity';

export enum MembershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum PlanType {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
}

@Entity()
export class Membership extends AbstractBaseEntity {
  @Column()
  user_id: string;

  @Column()
  user_type: string;

  @ManyToOne(() => Tier, { eager: true })
  tier: Tier;

  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.INACTIVE })
  status: MembershipStatus;

  @Column({ type: 'enum', enum: PlanType })
  plan_type: PlanType;

  @Column()
  starts_at: Date;

  @Column()
  expires_at: Date;

  @Column({ default: false })
  is_trial: boolean;

  @Column({
    type: 'enum',
    enum: ['standard', 'winter', 'summer', 'autumn', 'spring'],
    default: 'standard',
  })
  variant: 'standard' | 'winter' | 'summer' | 'autumn' | 'spring';

  @Column({
    type: 'enum',
    enum: ['basic', 'pro', 'pro_plus'],
    default: 'basic',
  })
  progression_level: 'basic' | 'pro' | 'pro_plus';
}
