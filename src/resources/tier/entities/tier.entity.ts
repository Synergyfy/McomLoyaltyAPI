import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { TierStatus } from './tier-status.enum';
import { TierConfig } from '../interfaces/tier-config.interface';

@Entity()
export class Tier extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthly_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  annual_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quaterly_price: number;

  @Column('simple-array')
  features: string[];

  @Column({
    type: 'enum',
    enum: TierStatus,
    default: TierStatus.DRAFT,
  })
  status: TierStatus;

  @Column({ nullable: true })
  stripe_monthly_price_id: string;

  @Column({ nullable: true })
  stripe_quarterly_price_id: string;

  @Column({ nullable: true })
  stripe_annual_price_id: string;

  @Column({ nullable: true })
  paypal_monthly_plan_id: string;

  @Column({ nullable: true })
  paypal_quarterly_plan_id: string;

  @Column({ nullable: true })
  paypal_annual_plan_id: string;

  @Column({ type: 'int', default: 0 })
  qrCodeCount: number;

  @Column({ type: 'jsonb', nullable: true })
  configuration: TierConfig;
}
