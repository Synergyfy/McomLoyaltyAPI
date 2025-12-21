import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { BusinessStampReward } from "./business-stamp-reward.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { StampCardStatus } from "../enums/stamp-card-status.enum";
import { StampEvent } from "./stamp-event.entity";

@Entity("stamp_cards")
export class StampCard extends AbstractBaseEntity {
  /**
   * The specific reward program this card belongs to.
   */
  @ManyToOne(() => BusinessStampReward, (reward) => reward.stampCards)
  businessStampReward: BusinessStampReward;

  /**
   * The participant who owns this card.
   */
  @ManyToOne(() => Participant)
  participant: Participant;

  /**
   * Current number of stamps collected on this card.
   */
  @Column({ default: 0 })
  current_stamps: number;

  /**
   * Current status of the card (IN_PROGRESS, COMPLETED, REDEEMED).
   */
  @Column({
    type: "enum",
    enum: StampCardStatus,
    default: StampCardStatus.IN_PROGRESS,
  })
  status: StampCardStatus;

  /**
   * Timestamp when the card reached the required number of stamps.
   */
  @Column({ type: "timestamp", nullable: true })
  completed_at: Date;

  /**
   * Timestamp when the reward was redeemed by the participant.
   */
  @Column({ type: "timestamp", nullable: true })
  redeemed_at: Date;

  /**
   * History of stamp events (adds) for this card.
   */
  @OneToMany(() => StampEvent, (event) => event.stampCard)
  events: StampEvent[];
}
