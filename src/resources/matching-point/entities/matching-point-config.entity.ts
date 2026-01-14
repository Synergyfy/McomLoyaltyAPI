import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";

export enum MatchingPointActivityType {
  CAMPAIGN_CREATION = "CAMPAIGN_CREATION",
  REFERRAL = "REFERRAL",
  MEMBERSHIP_PAYMENT = "MEMBERSHIP_PAYMENT",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
  REWARD_REDEMPTION = "REWARD_REDEMPTION",
}

@Entity("matching_point_config")
export class MatchingPointConfig extends AbstractBaseEntity {
  @ApiProperty({
    enum: MatchingPointActivityType,
    description: "Type of activity",
  })
  @Column({ type: "enum", enum: MatchingPointActivityType, unique: true })
  activity_type: MatchingPointActivityType;

  @ApiProperty({ description: "Points to award for this activity" })
  @Column({ type: "int", default: 0 })
  points: number;

  @ApiProperty({ description: "Is this activity configuration active?" })
  @Column({ default: true })
  is_active: boolean;
}
