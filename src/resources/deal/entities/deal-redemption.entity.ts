import { Entity, Column, ManyToOne, Index } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Deal } from "./deal.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { RedemptionStatus } from "../enums/redemption-status.enum";

@Entity("deal_redemptions")
export class DealRedemption extends AbstractBaseEntity {
  @ManyToOne(() => Deal, (deal) => deal.redemptions, { onDelete: "CASCADE" })
  deal: Deal;

  @ManyToOne(() => Participant, (participant) => participant.dealRedemptions, {
    onDelete: "CASCADE",
  })
  user: Participant;

  @Column({
    type: "enum",
    enum: RedemptionStatus,
    default: RedemptionStatus.PENDING,
  })
  status: RedemptionStatus;

  @Index({ unique: true })
  @Column()
  redemptionCode: string;

  @Column({ nullable: true })
  redeemedAt: Date;
}
