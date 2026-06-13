import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  OneToOne,
  ManyToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Role } from "../../../common/role.enum";
import { Sector } from "../../sector/entities/sector.entity";
import { Category } from "../../category/entities/category.entity";
import { SubCategory } from "../../subcategory/entities/subcategory.entity";
import { Referral } from "../../referral/entities/referral.entity";
import { Deal } from "../../deal/entities/deal.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Membership } from "../../membership/entities/membership.entity";
import { Network } from "../../network/entities/network.entity";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";

import { BusinessWallet } from "../../wallet/entities/business-wallet.entity";

@Entity("businesses")
export class Business extends AbstractBaseEntity {
  @ApiProperty({ description: "OTP for email verification (only present if SMTP mail delivery fails)", required: false })
  otp?: string;

  @ApiProperty({ description: "The first name of the business owner", required: false })
  @Column({ nullable: true })
  firstName: string;

  @ApiProperty({ description: "The last name of the business owner", required: false })
  @Column({ nullable: true })
  lastName: string;

  @ApiProperty({ description: "The name of the business" })
  @Column()
  name: string;

  @BeforeInsert()
  @BeforeUpdate()
  updateName() {
    if (this.firstName || this.lastName) {
      this.name = `${this.firstName || ""} ${this.lastName || ""}`.trim();
    }
  }

  @OneToOne(() => BusinessWallet, (wallet) => wallet.business, {
    cascade: true,
  })
  wallet: BusinessWallet;

  @ApiProperty({ description: "The email of the business" })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    description: "The phone number of the business",
    required: false,
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ description: "The address of the business", required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({
    description: "The postal code of the business",
    required: false,
  })
  @Column({ nullable: true })
  postalCode: string;

  @Index()
  @ApiProperty({
    type: () => Sector,
    description: "The sector the business belongs to",
  })
  @ManyToOne(() => Sector, (sector) => sector.businesses)
  sector: Sector;

  @Index()
  @ApiProperty({
    type: () => Category,
    description: "The category the business belongs to",
  })
  @ManyToOne(() => Category, (category) => category.businesses)
  category: Category;

  @Index()
  @ApiProperty({
    type: () => SubCategory,
    description: "The subcategory the business belongs to",
  })
  @ManyToOne(() => SubCategory, (subCategory) => subCategory.businesses)
  subCategory: SubCategory;

  @OneToMany(() => Staff, (staff) => staff.business)
  staff: Staff[];

  @ApiProperty({ description: "The website of the business", required: false })
  @Column({ nullable: true })
  website?: string;

  @ApiProperty({
    description: "Social media links of the business",
    required: false,
  })
  @Column({ type: "jsonb", nullable: true })
  socialMedia?: Record<string, string>;

  @ApiProperty({ description: "The unique code of the business" })
  @Column({ unique: true })
  uniqueCode: string;

  @ApiProperty({
    enum: Role,
    description: "The role of the user",
    default: Role.Business,
  })
  @Column({ type: "enum", enum: Role, default: Role.Business })
  role: Role;

  @ApiProperty({
    description: "The referral capacity of the business",
    required: false,
  })
  @Column({ type: "int", nullable: true })
  referralCapacity?: number;

  @ApiProperty({
    description: "The affiliate code of the business",
    required: false,
  })
  @Column({ unique: true, nullable: true })
  affiliateCode: string;

  @ManyToOne(() => Business, (business) => business.referrals)
  referredBy: Business;

  @OneToMany(() => Referral, (referral) => referral.referrerBusiness)
  referrals: Referral[];

  @ApiProperty({
    description: "The referral points of the business",
    default: 0,
  })
  @Column({ type: "numeric", default: 0 })
  referralPoints: number;

  @ApiProperty({
    description: "The reputation points of the business",
    default: 0,
  })
  @Column({ type: "numeric", default: 0 })
  reputation_points: number;

  @ApiProperty({
    description: "The profile image URL of the business",
    required: false,
  })
  @Column({ nullable: true })
  profile_image: string;

  @ApiProperty({
    description: "The banner image URL of the business",
    required: false,
  })
  @Column({ nullable: true })
  banner: string;

  @OneToMany(() => Deal, (deal) => deal.business)
  deals: Deal[];

  @ApiProperty({
    description: "Whether the business is disabled",
    default: false,
  })
  @Column({ default: false })
  isDisabled: boolean;

  @OneToMany(() => Campaign, (campaign) => campaign.business)
  campaigns: Campaign[];

  @OneToMany(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.business,
  )
  businessCampaigns: BusinessCampaign[];

  @ApiProperty({ description: "The Stripe customer ID", required: false })
  @Column({ nullable: true })
  stripe_customer_id: string;

  @ApiProperty({
    description:
      "Total points earned by participants in campaigns owned by this business",
    default: 0,
  })
  @Column({ default: 0 })
  total_points_earned: number;

  @ApiProperty({
    description:
      "Total points redeemed by participants in campaigns owned by this business",
    default: 0,
  })
  @Column({ default: 0 })
  total_points_redeemed: number;

  @OneToMany(() => Membership, (membership) => membership.business)
  memberships: Membership[];

  @ApiProperty({
    description:
      "The remaining monthly point balance of the business (virtual property)",
    required: false,
  })
  remainingPointBalance?: number;

  @ApiProperty({
    description: "Extra points purchased by the business",
    default: 0,
  })
  @Column({ type: "int", default: 0 })
  extraPoints: number;

  @ApiProperty({
    description: "Matching points earned by the business",
    default: 0,
  })
  @Column({ type: "int", default: 0 })
  matching_points: number;

  @ApiProperty({
    description: "Whether the business email is verified",
    default: false,
  })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({
    description: "Whether the business is a super business (platform owned)",
    default: false,
  })
  @Column({ default: false })
  isSuperBusiness: boolean;

  @ApiProperty({
    enum: NetworkLocationTag,
    description: "Location tag",
    required: false,
  })
  @Column({ type: "enum", enum: NetworkLocationTag, nullable: true })
  locationTag: NetworkLocationTag;

  @ApiProperty({
    enum: NetworkRelationshipTag,
    description: "Relationship tag",
    required: false,
  })
  @Column({ type: "enum", enum: NetworkRelationshipTag, nullable: true })
  relationshipTag: NetworkRelationshipTag;

  @OneToMany(() => Network, (network) => network.business)
  network: Network[];

  @ManyToMany(
    () => BusinessCampaign,
    (campaign) => campaign.participatingBusinesses,
  )
  joinedCampaigns: BusinessCampaign[];
}
