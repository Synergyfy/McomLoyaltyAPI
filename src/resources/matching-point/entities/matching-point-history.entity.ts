import { Entity, Column, ManyToOne, Index } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { MatchingPointActivityType } from "./matching-point-config.entity";

@Entity("matching_point_history")
@Index(["business", "created_at"])
@Index(["participant", "created_at"])
@Index(["business", "activity_type", "created_at"])
@Index(["participant", "activity_type", "created_at"])
export class MatchingPointHistory extends AbstractBaseEntity {
  @ApiProperty({ type: () => Business })
  @ManyToOne(() => Business, { onDelete: "CASCADE", nullable: true })
  business: Business;

  @ApiProperty({ type: () => Participant })
  @ManyToOne(() => Participant, { onDelete: "CASCADE", nullable: true })
  participant: Participant;

  @ApiProperty({ description: "Points added or removed" })
  @Column({ type: "int" })
  points: number;

  @ApiProperty({ description: "Balance after this transaction" })
  @Column({ type: "int", default: 0 })
  balance_after: number;

  @ApiProperty({
    enum: MatchingPointActivityType,
    description: "Type of activity",
  })
  @Column({ type: "enum", enum: MatchingPointActivityType })
  activity_type: MatchingPointActivityType;

  @ApiProperty({ description: "Description or reason for these points" })
  @Column({ nullable: true })
  @Index() // Simple index for description search
  description: string;
}
