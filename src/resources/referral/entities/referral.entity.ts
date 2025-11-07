import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Entity('referrals')
export class Referral extends AbstractBaseEntity {
  @ManyToOne(() => Business)
  referrer: Business;

  @ManyToOne(() => Business)
  referred: Business;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;
}
