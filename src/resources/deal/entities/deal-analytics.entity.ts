import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Deal } from "./deal.entity";

@Entity("deal_analytics")
export class DealAnalytics extends AbstractBaseEntity {
  @ManyToOne(() => Deal, (deal) => deal.analytics, { onDelete: "CASCADE" })
  @JoinColumn({ name: "deal_id" })
  deal: Deal;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  ip_hash: string;

  @Column({ type: "int", default: 0 })
  time_spent_seconds: number;
}
