
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Category } from '../../category/entities/category.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

export enum DealType {
  DISCOUNT = 'Discount',
  CASHBACK = 'Cashback',
  BOGO = 'BOGO',
}

export enum DealAudience {
  ALL = 'All',
  STUDENTS = 'Students',
  SENIORS = 'Seniors',
}

@Entity()
export class Deal extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'enum', enum: DealType })
  type: DealType;

  @Column({ type: 'decimal' })
  value: number;

  @Index()
  @Column()
  startDate: Date;

  @Index()
  @Column()
  endDate: Date;

  @Column({ type: 'enum', enum: DealAudience })
  audience: DealAudience;

  @Index()
  @ManyToOne(() => Category, (category) => category.deals)
  category: Category;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Business, (business) => business.deals)
  business: Business;
}
