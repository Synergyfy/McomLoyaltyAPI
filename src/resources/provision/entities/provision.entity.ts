import { Entity, Column } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";

export enum ProvisionType {
  TIER_ACCESS = "TIER_ACCESS",
  // Add other types as needed
}

@Entity()
export class Provision extends AbstractBaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ type: "enum", enum: ProvisionType })
  type: ProvisionType;

  @Column({ type: "jsonb", nullable: true })
  payload: any;

  @Column({ default: false })
  isRedeemed: boolean;

  @Column({ nullable: true })
  redeemedAt: Date;

  @Column({ nullable: true })
  redeemedByUserId: string;

  @Column()
  expiresAt: Date;
}
