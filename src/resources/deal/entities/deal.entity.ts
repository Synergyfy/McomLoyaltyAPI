import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Category } from "../../category/entities/category.entity";
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { DealStatus } from "../enums/deal-status.enum";
import { DealType } from "../enums/deal-type.enum";
import { RedemptionMethod } from "../enums/redemption-method.enum";
import { DealVisibility } from "../enums/deal-visibility.enum";
import { DealRedemption } from "./deal-redemption.entity";
import { DealReview } from "./deal-review.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { DealAnalytics } from "./deal-analytics.entity";

@Entity("deals")
export class Deal extends AbstractBaseEntity {
  @ApiProperty({ description: "The title of the deal" })
  @Column()
  title: string;

  @ApiProperty({ description: "The description of the deal" })
  @Column({ type: "text" })
  description: string;

  @ApiProperty({ description: "The image URL of the deal", required: false })
  @Column({ nullable: true })
  imageUrl: string;

  @ApiProperty({ description: "The value/price of the deal", default: 0.0 })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0.0 })
  value: number;

  @ApiProperty({ description: "The start date of the deal" })
  @Index()
  @Column()
  startDate: Date;

  @ApiProperty({ description: "The end date of the deal" })
  @Index()
  @Column()
  endDate: Date;

  @ApiProperty({ description: "Terms and conditions" })
  @Column({ type: "text" })
  termsAndConditions: string;

  @ApiProperty({ enum: DealStatus, description: "The status of the deal" })
  @Column({ type: "enum", enum: DealStatus, default: DealStatus.PENDING })
  status: DealStatus;

  @ApiProperty({ description: "Whether the deal is active" })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: "Whether the deal is approved" })
  @Column({ default: false })
  isApproved: boolean;

  @ApiProperty({
    description: "Short description of the deal",
    required: false,
  })
  @Column({ nullable: true })
  shortDescription: string;

  @ApiProperty({ enum: DealType, description: "Type of the deal" })
  @Column({ type: "enum", enum: DealType, default: DealType.DISCOUNT })
  type: DealType;

  @ApiProperty({ description: "Array of image URLs", type: [String] })
  @Column("text", { array: true, default: [] })
  images: string[];

  @ApiProperty({
    description: "Array of gallery image URLs",
    type: [String],
    required: false,
  })
  @Column("text", { array: true, default: [] })
  galleryImages: string[];

  @ApiProperty({
    description: "Original price before discount",
    required: false,
  })
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @ApiProperty({ description: "Deal price" })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0.0 })
  dealPrice: number;

  @ApiProperty({ description: "Maximum quantity available", required: false })
  @Column({ nullable: true })
  maxQuantity: number;

  @ApiProperty({ description: "Quantity sold so far" })
  @Column({ default: 0 })
  soldQuantity: number;

  @ApiProperty({ description: "Limit per customer", required: false })
  @Column({ nullable: true })
  perCustomerLimit: number;

  @ApiProperty({ enum: RedemptionMethod, description: "Redemption method" })
  @Column({
    type: "enum",
    enum: RedemptionMethod,
    default: RedemptionMethod.QR_SCAN,
  })
  redemptionMethod: RedemptionMethod;

  @ApiProperty({ description: "Location of the deal", required: false })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ description: "Whether the deal is featured" })
  @Column({ default: false })
  isFeatured: boolean;

  @ApiProperty({ enum: DealVisibility, description: "Visibility of the deal" })
  @Column({
    type: "enum",
    enum: DealVisibility,
    default: DealVisibility.PUBLIC,
  })
  visibility: DealVisibility;

  @ApiProperty({
    description: "Whether this deal can be redeemed with points",
    default: false,
  })
  @Column({ default: false })
  isReward: boolean;

  @ApiProperty({
    description: "Points required to redeem this deal",
    required: false,
  })
  @Column({ nullable: true })
  pointsCost: number;

  @ApiProperty({
    description: "Points earned when purchasing this deal",
    default: 0,
  })
  @Column({ default: 0 })
  pointsEarned: number;

  @Index()
  @ManyToOne(() => Category, (category) => category.deals, {
    onDelete: "CASCADE",
  })
  category: Category;

  @ManyToOne(() => Business, (business) => business.deals, {
    onDelete: "CASCADE",
  })
  business: Business;

  @OneToMany(() => DealRedemption, (redemption) => redemption.deal)
  redemptions: DealRedemption[];

  @OneToMany(() => DealReview, (review) => review.deal)
  reviews: DealReview[];

  @ManyToMany(() => Campaign, (campaign) => campaign.deals)
  campaigns: Campaign[];

  @ManyToMany(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.deals,
  )
  businessCampaigns: BusinessCampaign[];

  @OneToMany(() => DealAnalytics, (analytics) => analytics.deal)
  analytics: DealAnalytics[];
}
