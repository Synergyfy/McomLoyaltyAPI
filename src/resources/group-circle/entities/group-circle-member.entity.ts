import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { GroupCircle } from "./group-circle.entity";
import { Network } from "../../network/entities/network.entity";
import { GroupCircleRole } from "../enums/group-circle.enums";
import { ApiProperty } from "@nestjs/swagger";

@Entity("group_circle_members")
export class GroupCircleMember extends AbstractBaseEntity {
  @ManyToOne(() => GroupCircle, (groupCircle) => groupCircle.members, {
    onDelete: "CASCADE",
  })
  groupCircle: GroupCircle;

  @ManyToOne(() => Network, { onDelete: "CASCADE" })
  network: Network;

  @ApiProperty({ enum: GroupCircleRole })
  @Column({
    type: "enum",
    enum: GroupCircleRole,
    default: GroupCircleRole.PERIPHERAL,
  })
  role: GroupCircleRole;

  @Column({ type: "timestamp", nullable: true })
  drawDate: Date;
}
