import { Entity, Column, ManyToOne } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { BusinessWallet } from "./business-wallet.entity";
import { ApiProperty } from "@nestjs/swagger";

export enum TransactionType {
  TIER_ALLOCATION = "TIER_ALLOCATION", // Monthly reset
  TOPUP = "TOPUP", // Stripe/Paypal topup
  SPEND_TIER = "SPEND_TIER", // Creating a reward using tier balance
  SPEND_TOPUP = "SPEND_TOPUP", // Creating a reward using topup balance
  REFUND = "REFUND",
}

@Entity()
export class WalletTransaction extends AbstractBaseEntity {
  @ApiProperty({ enum: TransactionType })
  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ description: "Amount of the transaction" })
  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: "Description or reference (e.g. Voucher ID)" })
  @Column({ nullable: true })
  reference: string;

  @ManyToOne(() => BusinessWallet, (wallet) => wallet.transactions)
  wallet: BusinessWallet;
}
