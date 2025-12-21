import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { StampPackage } from "./stamp-package.entity";

export enum BusinessStampPackageStatus {
  ACTIVE = "ACTIVE",
  DEPLETED = "DEPLETED",
  EXPIRED = "EXPIRED",
}

@Entity("business_stamp_packages")
export class BusinessStampPackage extends AbstractBaseEntity {
  @ManyToOne(() => Business)
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => StampPackage, (pkg) => pkg.businessPackages)
  @JoinColumn({ name: "package_id" })
  package: StampPackage;

  @ApiProperty({ description: "Name of the package at time of purchase" })
  @Column()
  name: string;

  @ApiProperty({ description: "Initial number of stamps" })
  @Column({ type: "int" })
  initial_stamps: number;

  @ApiProperty({ description: "Remaining stamps" })
  @Column({ type: "int" })
  remaining_stamps: number;

  @ApiProperty({ description: "Transaction ID from payment provider" })
  @Column({ nullable: true })
  transaction_id: string;

  @ApiProperty({
    description: "Status of the package",
    enum: BusinessStampPackageStatus,
  })
  @Column({
    type: "enum",
    enum: BusinessStampPackageStatus,
    default: BusinessStampPackageStatus.ACTIVE,
  })
  status: BusinessStampPackageStatus;
}
