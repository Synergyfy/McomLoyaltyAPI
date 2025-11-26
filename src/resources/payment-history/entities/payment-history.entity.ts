import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from '../../business/entities/business.entity';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Membership } from '../../membership/entities/membership.entity';

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity()
export class PaymentHistory extends AbstractBaseEntity {
  // TODO: change user_id to user
  @ManyToOne(() => Business)
  @JoinColumn({ name: 'user_id' })
  user: Business;

  @Column()
  user_type: string;

  @ManyToOne(() => Membership, { eager: true })
  membership: Membership;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentProvider })
  payment_provider: PaymentProvider;

  @Column()
  transaction_id: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;
}
