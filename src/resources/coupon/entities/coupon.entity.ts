import { Entity, Column } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
}

@Entity()
export class Coupon extends AbstractBaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ type: "enum", enum: DiscountType })
  discount_type: DiscountType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  discount_value: number;

  @Column()
  expires_at: Date;

  @Column({ default: true })
  is_active: boolean;
}
