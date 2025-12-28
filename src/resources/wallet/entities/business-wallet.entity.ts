import { Entity, Column, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { WalletTransaction } from "./wallet-transaction.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity()
export class BusinessWallet extends AbstractBaseEntity {
  @ApiProperty({
    description:
      "Balance allocated from the Tier subscription (resets monthly)",
  })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  tier_balance: number;

  @ApiProperty({ description: "Balance from direct Top-ups (does not expire)" })
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  topup_balance: number;

  @ApiProperty({ description: "Currency code", default: "GBP" })
  @Column({ default: "GBP" })
  currency: string;

  @OneToOne(() => Business)
  @JoinColumn()
  business: Business;

  @OneToMany(() => WalletTransaction, (transaction) => transaction.wallet)
  transactions: WalletTransaction[];
}
