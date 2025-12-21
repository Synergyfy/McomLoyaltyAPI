import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { GroupCircle } from "./group-circle.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("group_activities")
export class GroupActivity extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  action: string; // e.g., 'JOINED', 'POSTED', 'UPDATED'

  @ApiProperty()
  @Column({ type: "jsonb", nullable: true })
  details: any;

  @ManyToOne(() => GroupCircle, { onDelete: "CASCADE" })
  groupCircle: GroupCircle;
}
