import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { GroupCircle } from "./group-circle.entity";
import { GroupCircleMember } from "./group-circle-member.entity";
import { PaymentProvider } from "../enums/group-circle.enums";
import { ApiProperty } from "@nestjs/swagger";

export enum ContributionStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

@Entity("group_circle_contributions")
export class GroupCircleContribution extends AbstractBaseEntity {
  @ManyToOne(() => GroupCircle, { onDelete: "CASCADE" })
  groupCircle: GroupCircle;

  @ManyToOne(() => GroupCircleMember, { onDelete: "CASCADE" })
  member: GroupCircleMember;

  @ApiProperty()
  @Column({ type: "decimal" })
  amount: number;

  @ApiProperty()
  @Column({ type: "int" })
  round: number;

  @ApiProperty({ enum: ContributionStatus })
  @Column({
    type: "enum",
    enum: ContributionStatus,
    default: ContributionStatus.PENDING,
  })
  status: ContributionStatus;

  @ApiProperty()
  @Column({ type: "timestamp", nullable: true })
  paidAt: Date;

  @ApiProperty({ enum: PaymentProvider })
  @Column({
    type: "enum",
    enum: PaymentProvider,
    default: PaymentProvider.MANUAL,
  })
  provider: PaymentProvider;

  @ApiProperty()
  @Column({ nullable: true })
  transactionId: string;
}
