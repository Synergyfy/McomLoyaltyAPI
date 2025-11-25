import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
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
  @ApiProperty({ description: 'The name of the business' })
  @Column()
  name: string;

  @ApiProperty({ description: 'The email of the business' })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ description: 'The phone number of the business', required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: 'The address of the business', required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ type: () => Sector, description: 'The sector the business belongs to' })
  @ManyToOne(() => Sector, (sector) => sector.businesses)
  sector: Sector;

  @ApiProperty({ type: () => Category, description: 'The category the business belongs to' })
  @ManyToOne(() => Category, (category) => category.businesses)
  category: Category;

  @ApiProperty({ type: () => SubCategory, description: 'The subcategory the business belongs to' })
  @ManyToOne(() => SubCategory, (subCategory) => subCategory.businesses)
  subCategory: SubCategory;

  @OneToMany(() => Staff, (staff) => staff.business)
  staff: Staff[];

  @ApiProperty({ description: 'The website of the business', required: false })
  @Column({ nullable: true })
  website?: string;

  @ApiProperty({ description: 'Social media links of the business', required: false })
  @Column({ type: 'jsonb', nullable: true })
  socialMedia?: Record<string, string>;

  @ApiProperty({ description: 'The unique code of the business' })
  @Column({ unique: true })
  uniqueCode: string;

  @ApiProperty({ enum: Role, description: 'The role of the user', default: Role.Business })
  @Column({ type: 'enum', enum: Role, default: Role.Business })
  role: Role;

  @ApiProperty({ description: 'The referral capacity of the business', required: false })
  @Column({ nullable: true })
  referralCapacity?: number;

  @ApiProperty({ description: 'The affiliate code of the business', required: false })
  @Column({ unique: true, nullable: true })
  affiliateCode: string;

  @ManyToOne(() => Business, (business) => business.referrals)
  referredBy: Business;

  @OneToMany(() => Referral, (referral) => referral.referrer)
  referrals: Referral[];

  @ApiProperty({ description: 'The referral points of the business', default: 0 })
  @Column({ type: 'numeric', default: 0 })
  referralPoints: number;

  @ApiProperty({ description: 'The reputation points of the business', default: 0 })
  @Column({ type: 'numeric', default: 0 })
  reputation_points: number;

  @OneToMany(() => Deal, (deal) => deal.business)
  deals: Deal[];

  @ApiProperty({ description: 'Whether the business is disabled', default: false })
  @Column({ default: false })
  isDisabled: boolean;

  @OneToMany(() => Campaign, (campaign) => campaign.business)
  campaigns: Campaign[];

  @OneToMany(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.business,
  )
  businessCampaigns: BusinessCampaign[];

  @ApiProperty({ description: 'The Stripe customer ID', required: false })
  @Column({ nullable: true })
  stripe_customer_id: string;

  @ApiProperty({ description: 'Total points earned by participants in campaigns owned by this business', default: 0 })
  @Column({ default: 0 })
  total_points_earned: number;

  @ApiProperty({ description: 'Total points redeemed by participants in campaigns owned by this business', default: 0 })
  @Column({ default: 0 })
  total_points_redeemed: number;
}
