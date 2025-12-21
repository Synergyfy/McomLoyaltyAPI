import { Entity, Column } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("earning_actions")
export class EarningAction extends AbstractBaseEntity {
  @ApiProperty({ description: "Human readable name (e.g. Daily Login)" })
  @Column()
  name: string;

  @ApiProperty({ description: "System constant key (e.g. LOGIN_DAILY)" })
  @Column({ unique: true })
  key: string;

  @ApiProperty({ description: "Points awarded for this action" })
  @Column({ type: "int", default: 0 })
  points: number;

  @ApiProperty({ description: "Description of the action" })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: "JSON parameters for limits (e.g. { dailyLimit: 1 })",
  })
  @Column({ type: "json", nullable: true })
  actionParameters: any;

  @ApiProperty({ description: "Is this action currently active?" })
  @Column({ default: true })
  isActive: boolean;
}
