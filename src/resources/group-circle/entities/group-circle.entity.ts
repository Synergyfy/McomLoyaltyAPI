import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { GroupCircleMember } from "./group-circle-member.entity";
import {
  GroupCircleType,
  InteractionLevel,
  GroupCircleDuration,
  GroupCircleStatus,
} from "../enums/group-circle.enums";
import { ApiProperty } from "@nestjs/swagger";

@Entity("group_circles")
export class GroupCircle extends AbstractBaseEntity {
  @ApiProperty({ description: "Name of the group circle" })
  @Column()
  name: string;

  @ApiProperty({ description: "Description", required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ enum: GroupCircleType, description: "Type of group circle" })
  @Column({ type: "enum", enum: GroupCircleType })
  type: GroupCircleType;

  @ApiProperty({ enum: GroupCircleDuration, description: "Duration in days" })
  @Column({ type: "int" })
  duration: GroupCircleDuration;

  @ApiProperty({ enum: InteractionLevel, description: "Interaction level" })
  @Column({ type: "enum", enum: InteractionLevel })
  interactionLevel: InteractionLevel;

  @ApiProperty({ enum: GroupCircleStatus, description: "Status" })
  @Column({
    type: "enum",
    enum: GroupCircleStatus,
    default: GroupCircleStatus.ACTIVE,
  })
  status: GroupCircleStatus;

  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  business: Business;

  @OneToMany(() => GroupCircleMember, (member) => member.groupCircle, {
    cascade: true,
  })
  members: GroupCircleMember[];

  @ApiProperty({
    description: "Contribution amount for Smart Money",
    required: false,
  })
  @Column({ type: "decimal", nullable: true })
  contributionAmount: number;

  @ApiProperty({ description: "Payout frequency", required: false })
  @Column({ nullable: true })
  payoutFrequency: string;

  @ApiProperty({
    description: "Current round for Smart Money",
    required: false,
  })
  @Column({ type: "int", default: 0 })
  currentRound: number;

  @ApiProperty({ description: "Start date of the circle", required: false })
  @Column({ type: "timestamp", nullable: true })
  startDate: Date;
}
