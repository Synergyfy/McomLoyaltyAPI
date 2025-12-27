import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { BusinessWallet } from "./entities/business-wallet.entity";
import {
  WalletTransaction,
  TransactionType,
} from "./entities/wallet-transaction.entity";
import {
  Membership,
  MembershipStatus,
} from "../membership/entities/membership.entity";

@Injectable()
export class WalletCronService {
  private readonly logger = new Logger(WalletCronService.name);

  constructor(
    @InjectRepository(BusinessWallet)
    private readonly walletRepository: Repository<BusinessWallet>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  // Run at midnight on the 1st of every month
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetMonthlyAllowances() {
    this.logger.log("Starting monthly wallet allowance reset...");

    // Find all active memberships
    // This could be heavy, in prod we might paginate or use a stream
    const activeMemberships = await this.membershipRepository.find({
      where: { status: MembershipStatus.ACTIVE },
      relations: ["business", "tier"],
    });

    let count = 0;

    for (const membership of activeMemberships) {
      if (!membership.business) continue;

      const monthlyBudget =
        membership.tier.configuration?.quotas?.monthlyRewardBudget || 0;

      // If budget is 0, we might still want to reset to 0 if they had some left over?
      // Or if they downgraded?
      // Requirement: "Admin is setting amount... allocated... so they can spend"
      // "Resets monthly" implies set to X.

      const wallet = await this.walletRepository.findOne({
        where: { business: { id: membership.business.id } },
      });

      if (wallet) {
        // Use transaction for safety
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const oldBalance = Number(wallet.tier_balance);
          wallet.tier_balance = monthlyBudget;
          await queryRunner.manager.save(wallet);

          // Log transaction
          const transaction = queryRunner.manager.create(WalletTransaction, {
            wallet,
            amount: monthlyBudget - oldBalance, // The "Change"
            type: TransactionType.TIER_ALLOCATION,
            reference: `Monthly Reset: Set to ${monthlyBudget}`,
          });
          await queryRunner.manager.save(transaction);

          await queryRunner.commitTransaction();
          count++;
        } catch (e) {
          await queryRunner.rollbackTransaction();
          this.logger.error(
            `Failed to reset wallet for business ${membership.business.id}`,
            e,
          );
        } finally {
          await queryRunner.release();
        }
      }
    }

    this.logger.log(`Completed monthly reset for ${count} wallets.`);
  }
}
