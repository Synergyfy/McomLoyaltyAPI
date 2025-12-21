import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Business } from "../../business/entities/business.entity";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Membership } from "../../membership/entities/membership.entity";

export enum PaymentProvider {
  STRIPE = "stripe",
  PAYPAL = "paypal",
}

export enum PaymentStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  PENDING = "pending",
}

export enum PurchaseType {
  MEMBERSHIP = "membership",
  EXTRA_POINTS = "extra_points",
}

@Entity()
export class PaymentHistory extends AbstractBaseEntity {
  // TODO: change user_id to user
  @ManyToOne(() => Business)
  @JoinColumn({ name: "user_id" })
  user: Business;

  @Index()
  @Column()
  user_type: string;

  @ManyToOne(() => Membership, { eager: true, nullable: true })
  membership: Membership;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Index()
  @Column({ type: "enum", enum: PaymentProvider })
  payment_provider: PaymentProvider;

  @Index()
  @Column()
  transaction_id: string;

  @Index()
  @Column({ type: "enum", enum: PaymentStatus })
  status: PaymentStatus;

  @Index()
  @Column({
    type: "enum",
    enum: PurchaseType,
    default: PurchaseType.MEMBERSHIP,
  })
  purchaseType: PurchaseType;

  @Column({ type: "int", nullable: true })
  pointsPurchased: number;
}
