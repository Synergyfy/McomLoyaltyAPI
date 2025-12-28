import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { BusinessWallet } from "./entities/business-wallet.entity";
import {
  WalletTransaction,
  TransactionType,
} from "./entities/wallet-transaction.entity";
import { Business } from "../business/entities/business.entity";

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(BusinessWallet)
    private walletRepository: Repository<BusinessWallet>,
    @InjectRepository(WalletTransaction)
    private transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private dataSource: DataSource,
  ) {}

  async createWallet(business: Business): Promise<BusinessWallet> {
    const wallet = this.walletRepository.create({
      business,
      tier_balance: 0,
      topup_balance: 0,
    });
    return this.walletRepository.save(wallet);
  }

  async getWallet(businessId: string): Promise<BusinessWallet> {
    const wallet = await this.walletRepository.findOne({
      where: { business: { id: businessId } },
      relations: ["transactions"],
    });

    if (!wallet) {
      // Lazy creation for existing businesses
      const business = await this.businessRepository.findOne({
        where: { id: businessId },
      });
      if (!business) {
        throw new NotFoundException("Business not found");
      }
      return this.createWallet(business);
    }
    return wallet;
  }

  async addTierAllocation(businessId: string, amount: number) {
    const wallet = await this.getWallet(businessId);

    // Using a transaction to ensure integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Reset logic or Accumulate? Prompt implies "set amount allocated", usually resets monthly.
      // But let's assume accumulate for now or simple add.
      // User said "admin is setting amount... allocated... so they can spend".
      // Usually tier allowances reset. I will just ADD for now, assuming the caller handles the "Reset" logic if needed.

      wallet.tier_balance = Number(wallet.tier_balance) + Number(amount);
      await queryRunner.manager.save(wallet);

      const transaction = this.transactionRepository.create({
        wallet,
        amount,
        type: TransactionType.TIER_ALLOCATION,
        reference: `Monthly Allocation`,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return wallet;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async topUpWallet(
    businessId: string,
    amount: number,
    paymentReference: string,
  ) {
    const wallet = await this.getWallet(businessId);

    wallet.topup_balance = Number(wallet.topup_balance) + Number(amount);
    await this.walletRepository.save(wallet);

    const transaction = this.transactionRepository.create({
      wallet,
      amount,
      type: TransactionType.TOPUP,
      reference: paymentReference,
    });
    return this.transactionRepository.save(transaction);
  }

  /**
   * Deducts funds for a reward. Prioritizes Tier Balance, then Topup Balance.
   */
  async spend(
    businessId: string,
    amount: number,
    reference: string,
  ): Promise<boolean> {
    const wallet = await this.getWallet(businessId);
    const cost = Number(amount);

    console.log(wallet, "wallet");
    console.log(cost, "cost");

    if (Number(wallet.tier_balance) + Number(wallet.topup_balance) < cost) {
      throw new BadRequestException(
        "Insufficient funds to create this reward.",
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let remainingCost = cost;
      let tierDeduction = 0;
      let topupDeduction = 0;

      // 1. Try Tier Balance
      if (Number(wallet.tier_balance) > 0) {
        const tierAvailable = Number(wallet.tier_balance);
        if (tierAvailable >= remainingCost) {
          tierDeduction = remainingCost;
          wallet.tier_balance = tierAvailable - remainingCost;
          remainingCost = 0;
        } else {
          tierDeduction = tierAvailable;
          wallet.tier_balance = 0;
          remainingCost = remainingCost - tierAvailable;
        }
      }

      // 2. Try Topup Balance
      if (remainingCost > 0) {
        const topupAvailable = Number(wallet.topup_balance);
        // We already checked total funds, so this should be safe
        topupDeduction = remainingCost;
        wallet.topup_balance = topupAvailable - remainingCost;
      }

      await queryRunner.manager.save(wallet);

      // Record Transactions
      if (tierDeduction > 0) {
        const t1 = this.transactionRepository.create({
          wallet,
          amount: -tierDeduction,
          type: TransactionType.SPEND_TIER,
          reference,
        });
        await queryRunner.manager.save(t1);
      }

      if (topupDeduction > 0) {
        const t2 = this.transactionRepository.create({
          wallet,
          amount: -topupDeduction,
          type: TransactionType.SPEND_TOPUP,
          reference,
        });
        await queryRunner.manager.save(t2);
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
