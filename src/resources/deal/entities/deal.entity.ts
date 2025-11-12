
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Category } from '../../category/entities/category.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { DealStatus } from '../enums/deal-status.enum';

@Entity('deals')
export class Deal extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  value: number;

  @Index()
  @Column()
  startDate: Date;

  @Index()
  @Column()
  endDate: Date;

  @Column({ type: 'text' })
  termsAndConditions: string;

  @Column({ type: 'enum', enum: DealStatus, default: DealStatus.PENDING })
  status: DealStatus;

  @Column({ default: true })
  isActive: boolean;

  @Index()
  @ManyToOne(() => Category, (category) => category.deals, { onDelete: 'CASCADE' })
  category: Category;

  @ManyToOne(() => Business, (business) => business.deals, { onDelete: 'CASCADE' })
  business: Business;
}
