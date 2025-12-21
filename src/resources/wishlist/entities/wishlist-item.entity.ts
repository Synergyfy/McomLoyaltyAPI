import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Category } from "../../category/entities/category.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { Relationship, Occasion, Season, Priority } from "./wishlist-enums";

@Entity("wishlist_items")
export class WishlistItem extends AbstractBaseEntity {
  @Column()
  itemName: string;

  @Column({ nullable: true })
  itemImageUrl: string;

  @ManyToOne(() => Category, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "category_id" })
  category: Category;

  @ManyToOne(() => Participant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "participant_id" })
  participant: Participant;

  @Column({ type: "boolean", default: false })
  isForThirdParty: boolean;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({
    type: "enum",
    enum: Relationship,
    nullable: true,
  })
  relationship: Relationship;

  @Column({
    type: "enum",
    enum: Occasion,
    default: Occasion.NONE,
  })
  occasion: Occasion;

  @Column({
    type: "enum",
    enum: Season,
    default: Season.NONE,
  })
  season: Season;

  @Column({ type: "date", nullable: true })
  targetDate: Date;

  @Column({
    type: "enum",
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ type: "boolean" })
  marketingConsent: boolean;
}
