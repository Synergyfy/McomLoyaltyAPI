import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { MatchingPointReward } from "./matching-point-reward.entity";
import { Business } from "../../business/entities/business.entity";
import { Participant } from "../../participant/entities/participant.entity";

export enum UserType {
  BUSINESS = "BUSINESS",
  PARTICIPANT = "PARTICIPANT",
}

@Entity("matching_point_redemption")
export class MatchingPointRedemption extends AbstractBaseEntity {
  @ManyToOne(() => MatchingPointReward)
  reward: MatchingPointReward;

  @ManyToOne(() => Business, { nullable: true })
  business: Business;

  @ManyToOne(() => Participant, { nullable: true })
  participant: Participant;

  @Column("int")
  points_spent: number;

  @Column({ type: "enum", enum: UserType })
  redeemer_type: UserType;
}
