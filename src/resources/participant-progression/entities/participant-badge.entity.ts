import { Entity, Column } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("participant_badges")
export class ParticipantBadge extends AbstractBaseEntity {
  @ApiProperty({ description: "Name of the badge (e.g. Bronze, Silver)" })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: "Priority level (1=lowest, 10=highest). Used for hierarchy.",
  })
  @Column({ type: "int", unique: true })
  priority: number;

  @ApiProperty({ description: "Point multiplier (e.g. 1.2 for 20% bonus)" })
  @Column({ type: "float", default: 1.0 })
  multiplier: number;

  @ApiProperty({ description: "List of benefits" })
  @Column({ type: "json", nullable: true })
  benefits: string[];

  @ApiProperty({ description: "Minimum combined points required" })
  @Column({ type: "int", default: 0 })
  minPoints: number;

  @ApiProperty({ description: "Max combined points (optional)" })
  @Column({ type: "int", nullable: true })
  maxPoints: number;

  @ApiProperty({
    description: "Benefits or privileges description (Legacy/Display)",
  })
  @Column({ type: "text", nullable: true })
  privileges: string;

  @ApiProperty({ description: "Color code for the badge" })
  @Column({ nullable: true })
  color: string;
}
