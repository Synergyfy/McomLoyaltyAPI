import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Tier } from "../../tier/entities/tier.entity";

@Entity("point_packages")
export class PointPackage extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "int" })
  points: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ default: "GBP" })
  currency: string;

  @ManyToMany(() => Tier)
  @JoinTable({
    name: "point_package_tiers",
    joinColumn: { name: "point_package_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tier_id", referencedColumnName: "id" },
  })
  tiers: Tier[];

  @Column({ default: true })
  is_active: boolean;
}
