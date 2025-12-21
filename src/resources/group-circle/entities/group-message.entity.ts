import { Entity, Column, ManyToOne, Index } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { GroupCircle } from "./group-circle.entity";
import { ApiProperty } from "@nestjs/swagger";
import { GroupMessageType } from "../enums/group-circle.enums";

@Entity("group_messages")
@Index(["groupCircle", "created_at"]) // Efficient for fetching latest messages in a group
@Index(["groupCircle", "type"]) // Efficient for filtering by message type
@Index(["groupCircle", "recipientId"]) // Efficient for fetching DMs for a specific user
@Index(["groupCircle", "senderId"]) // Efficient for fetching messages sent by a specific user
export class GroupMessage extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  content: string;

  @ManyToOne(() => GroupCircle, { onDelete: "CASCADE" })
  groupCircle: GroupCircle;

  @ApiProperty({ enum: GroupMessageType })
  @Column({
    type: "enum",
    enum: GroupMessageType,
    default: GroupMessageType.GROUP,
  })
  type: GroupMessageType;

  @ApiProperty()
  @Column()
  senderName: string;

  @ApiProperty()
  @Column()
  senderId: string; // UUID of Business or Network Member

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  recipientId: string; // UUID of Network Member (for DMs)

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  recipientName: string; // Name of recipient
}
