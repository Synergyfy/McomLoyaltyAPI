import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';

@Entity()
export class Tier extends AbstractBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthly_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  annual_price: number;

  @Column('simple-array')
  features: string[];
}
