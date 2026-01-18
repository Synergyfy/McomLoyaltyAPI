import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Admin } from "../../admin/entities/admin.entity";
import { Tier } from "./tier.entity";
import { TierStatus } from "./tier-status.enum";

@Entity()
export class TierHistory extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  monthly_price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  annual_price: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  quarterly_price: number;

  @Column("simple-array")
  features: string[];

  @Column({
    type: "enum",
    enum: TierStatus,
  })
  status: TierStatus;

  @ManyToOne(() => Tier, { nullable: false })
  tier: Tier;

  @ManyToOne(() => Admin, { nullable: false })
  admin: Admin;
}
