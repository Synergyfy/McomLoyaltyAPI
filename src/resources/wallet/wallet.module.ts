import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { WalletCronService } from "./wallet-cron.service";
import { BusinessWallet } from "./entities/business-wallet.entity";
import { WalletTransaction } from "./entities/wallet-transaction.entity";
import { Membership } from "../membership/entities/membership.entity";
import { Business } from "../business/entities/business.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessWallet,
      WalletTransaction,
      Membership,
      Business,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletCronService],
  exports: [WalletService],
})
export class WalletModule {}
