import { Entity, Column, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Tier } from "../../tier/entities/tier.entity";
import { BusinessStampPackage } from "./business-stamp-package.entity";

@Entity("stamp_packages")
export class StampPackage extends AbstractBaseEntity {
  @ApiProperty({ description: "The name of the stamp package" })
  @Column()
  name: string;

  @ApiProperty({ description: "The number of stamps in the package" })
  @Column({ type: "int" })
  stamps: number;

  @ApiProperty({
    description: "The price of the stamp package",
    example: 19.99,
  })
  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: "Whether the package is active" })
  @Column({ default: true })
  is_active: boolean;

  @ManyToMany(() => Tier)
  @JoinTable({
    name: "stamp_package_tiers",
    joinColumn: { name: "stamp_package_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tier_id", referencedColumnName: "id" },
  })
  tiers: Tier[];

  @OneToMany(
    () => BusinessStampPackage,
    (businessPackage) => businessPackage.package,
  )
  businessPackages: BusinessStampPackage[];
}
