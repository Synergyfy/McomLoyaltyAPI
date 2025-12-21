import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Tier } from "../../tier/entities/tier.entity";

export enum MembershipStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
}

export enum PlanType {
  MONTHLY = "monthly",
  ANNUAL = "annual",
  QUARTERLY = "quarterly",
}

import { Business } from "../../business/entities/business.entity";
import { PaymentProvider } from "../../payment-history/entities/payment-history.entity";

@Entity()
export class Membership extends AbstractBaseEntity {
  @ApiProperty({
    description: "The business associated with the membership",
    type: () => Business,
  })
  @ManyToOne(() => Business)
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ApiProperty({
    description: "The tier associated with the membership",
    type: () => Tier,
  })
  @ManyToOne(() => Tier, { eager: true })
  tier: Tier;

  @ApiProperty({
    description: "Status of the membership",
    enum: MembershipStatus,
    example: MembershipStatus.ACTIVE,
  })
  @Column({
    type: "enum",
    enum: MembershipStatus,
    default: MembershipStatus.INACTIVE,
  })
  status: MembershipStatus;

  @ApiProperty({
    description: "Plan type (monthly, annual, quarterly)",
    enum: PlanType,
    example: PlanType.MONTHLY,
  })
  @Column({ type: "enum", enum: PlanType })
  plan_type: PlanType;

  @ApiProperty({
    description: "Membership start date",
    example: "2024-01-01T00:00:00Z",
  })
  @Column()
  starts_at: Date;

  @ApiProperty({
    description: "Membership expiration date",
    example: "2025-01-01T00:00:00Z",
  })
  @Column()
  expires_at: Date;

  @ApiProperty({
    description: "Indicates if the membership is a trial",
    example: false,
  })
  @Column({ default: false })
  is_trial: boolean;

  @ApiProperty({
    description: "Seasonal variant (legacy/unused for new logic)",
    required: false,
  })
  @Column({
    type: "enum",
    enum: ["standard", "winter", "summer", "autumn", "spring"],
    default: "standard",
  })
  variant: "standard" | "winter" | "summer" | "autumn" | "spring";

  @ApiProperty({
    description: "Progression level within the tier",
    enum: ["basic", "pro", "pro_plus"],
    default: "basic",
  })
  @Column({
    type: "enum",
    enum: ["basic", "pro", "pro_plus"],
    default: "basic",
  })
  progression_level: "basic" | "pro" | "pro_plus";

  @ApiProperty({
    description: "Transaction ID associated with the membership",
    required: false,
  })
  @Column({ nullable: true })
  transaction_id: string;

  @ApiProperty({
    description: "Payment provider used",
    enum: PaymentProvider,
    required: false,
  })
  @Column({ type: "enum", enum: PaymentProvider, nullable: true })
  payment_provider: PaymentProvider;
}
