import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Role } from '../../../common/role.enum';
import { Sector } from '../../sector/entities/sector.entity';
import { Category } from '../../category/entities/category.entity';
import { SubCategory } from '../../subcategory/entities/subcategory.entity';
import { Referral } from '../../referral/entities/referral.entity';
import { Deal } from '../../deal/entities/deal.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';

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

  @Column({ unique: true, nullable: true })
  affiliateCode: string;

  @ManyToOne(() => Business, (business) => business.referrals)
  referredBy: Business;

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referrals: Referral[];

  @Column({ type: 'numeric', default: 0 })
  referralPoints: number;

  @OneToMany(() => Deal, (deal) => deal.business)
  deals: Deal[];

  @Column({ default: false })
  isDisabled: boolean;

  @OneToMany(() => Campaign, (campaign) => campaign.business)
  campaigns: Campaign[];

  @OneToMany(() => BusinessCampaign, (businessCampaign) => businessCampaign.business)
  addedCampaigns: BusinessCampaign[];

  @Column({ nullable: true })
  stripe_customer_id: string;
}