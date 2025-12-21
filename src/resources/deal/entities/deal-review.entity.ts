import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Deal } from "./deal.entity";
import { Participant } from "../../participant/entities/participant.entity";

@Entity("deal_reviews")
export class DealReview extends AbstractBaseEntity {
  @ManyToOne(() => Deal, (deal) => deal.reviews, { onDelete: "CASCADE" })
  deal: Deal;

  @ManyToOne(() => Participant, (participant) => participant.dealReviews, {
    onDelete: "CASCADE",
  })
  user: Participant;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text", nullable: true })
  comment: string;
}
