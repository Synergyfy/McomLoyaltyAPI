import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { PointHistory } from '../../point/entities/point-history.entity';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Role } from '../../../common/role.enum';
import { Sector } from '../../sector/entities/sector.entity';
import { Category } from '../../category/entities/category.entity';
import { SubCategory } from '../../subcategory/entities/subcategory.entity';
import { Referral } from '../../referral/entities/referral.entity';

@Entity('businesses')
export class Business extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @ManyToOne(() => Sector, (sector) => sector.businesses)
  sector: Sector;

  @ManyToOne(() => Category, (category) => category.businesses)
  category: Category;

  @ManyToOne(() => SubCategory, (subCategory) => subCategory.businesses)
  subCategory: SubCategory;

  @OneToMany(() => Staff, (staff) => staff.business)
  staff: Staff[];

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia?: Record<string, string>;

  @Column({ unique: true })
  uniqueCode: string;

  @Column({ type: 'enum', enum: Role, default: Role.Business })
  role: Role;

  @Column({ nullable: true })
  referralCapacity?: number;

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.awardedByBusiness)
  pointHistories: PointHistory[];

  @Column({ unique: true, nullable: true })
  affiliateCode: string;

  @ManyToOne(() => Business, (business) => business.referrals)
  referredBy: Business;

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referrals: Referral[];

  @Column({ type: 'numeric', default: 0 })
  referralPoints: number;
}