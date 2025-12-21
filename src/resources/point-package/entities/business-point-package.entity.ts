import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { PointPackage } from "./point-package.entity";

export enum BusinessPointPackageStatus {
  ACTIVE = "ACTIVE",
  DEPLETED = "DEPLETED",
  EXPIRED = "EXPIRED",
}

@Entity("business_point_packages")
export class BusinessPointPackage extends AbstractBaseEntity {
  @ManyToOne(() => Business)
  business: Business;

  @ManyToOne(() => PointPackage, { nullable: true })
  package: PointPackage;

  @Column()
  name: string;

  @Column({ type: "int" })
  initial_points: number;

  @Column({ type: "int" })
  remaining_points: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  purchase_date: Date;

  @Column({
    type: "enum",
    enum: BusinessPointPackageStatus,
    default: BusinessPointPackageStatus.ACTIVE,
  })
  status: BusinessPointPackageStatus;

  @Column({ nullable: true })
  transaction_id: string;
}
