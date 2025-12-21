import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import {
  NotificationType,
  NotificationRecipientType,
} from "../enums/notification-type.enum";
import { Business } from "../../business/entities/business.entity";
import { Participant } from "../../participant/entities/participant.entity";

@Entity("notifications")
export class Notification extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationRecipientType,
  })
  recipient_type: NotificationRecipientType;

  @Column({ default: false })
  is_read: boolean;

  // Polymorphic-like relationship for recipient
  // We will store the ID in a column but also have relations for TypeORM convenience if needed,
  // or just use separate columns for business and participant to maintain foreign key constraints.
  // Using separate columns is safer for referential integrity.

  @ManyToOne(() => Business, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Participant, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "participant_id" })
  participant: Participant;

  // Optional: Link to related entity ID (e.g., campaign ID, reward ID) for deep linking
  @Column({ nullable: true })
  related_entity_id: string;
}
