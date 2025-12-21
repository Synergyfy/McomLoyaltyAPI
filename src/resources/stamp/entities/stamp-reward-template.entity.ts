import { Entity, Column } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { StampTriggerMethod } from "../enums/stamp-trigger-method.enum";
import { StampRewardType } from "../enums/stamp-reward-type.enum";

@Entity("stamp_reward_templates")
export class StampRewardTemplate extends AbstractBaseEntity {
  /**
   * The name of the reward template (e.g., "Buy 5 Get 1 Free").
   */
  @Column()
  title: string;

  /**
   * A short description of the reward logic for businesses and customers.
   */
  @Column()
  description: string;

  /**
   * Number of stamps a customer must collect to unlock the reward.
   */
  @Column({ type: "int" })
  required_stamps: number;

  /**
   * The type of reward given upon completion (e.g., FREE_ITEM, DISCOUNT).
   */
  @Column({ type: "enum", enum: StampRewardType })
  reward_benefit: StampRewardType;

  /**
   * Additional details for the benefit (e.g., "10%" for discount, or "Coffee" for free item).
   */
  @Column({ nullable: true })
  reward_benefit_value: string;

  /**
   * The action required to earn a stamp (e.g., QR_SCAN).
   */
  @Column({ type: "enum", enum: StampTriggerMethod })
  trigger_method: StampTriggerMethod;

  /**
   * (Optional) Number of days the stamps are valid after the first stamp is earned.
   */
  @Column({ type: "int", nullable: true, comment: "Days valid after start" })
  stamp_validity_days: number;

  /**
   * (Optional) Number of days the customer has to claim the reward after unlocking it.
   */
  @Column({
    type: "int",
    nullable: true,
    comment: "Days to redeem after completion",
  })
  reward_claim_deadline_days: number;

  // --- Hybrid Mode (Stamps + Points) ---

  /**
   * If true, the customer earns points in addition to stamps.
   */
  @Column({ default: false })
  is_hybrid: boolean;

  /**
   * Points awarded per stamp earned.
   */
  @Column({ type: "int", default: 0 })
  hybrid_points_per_stamp: number;

  /**
   * Extra points awarded when the card is completed.
   */
  @Column({ type: "int", default: 0 })
  hybrid_completion_bonus_points: number;

  /**
   * If true, this template is visible to businesses in the library.
   */
  @Column({ default: false })
  is_published: boolean;

  /**
   * If true, this template is archived and not shown in active lists.
   */
  @Column({ default: false })
  is_archived: boolean;

  /**
   * Default image URL for the card, can be overridden by the business.
   */
  @Column({ nullable: true })
  default_image: string;
}
