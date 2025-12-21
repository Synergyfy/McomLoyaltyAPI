import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentHistory } from "./entities/payment-history.entity";
import { PaymentHistoryQueryDto } from "./dto/payment-history-query.dto";

@Injectable()
export class PaymentHistoryService {
  constructor(
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
  ) {}

  async findAll(query: PaymentHistoryQueryDto) {
    const {
      page,
      limit,
      search,
      status,
      payment_provider,
      user_type,
      purchase_type,
      min_amount,
      max_amount,
      sort,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentHistoryRepository
      .createQueryBuilder("paymentHistory")
      .leftJoinAndSelect("paymentHistory.user", "user")
      .skip(skip)
      .take(limit)
      .orderBy("paymentHistory.created_at", sort || "DESC");

    if (status) {
      queryBuilder.andWhere("paymentHistory.status = :status", { status });
    }

    if (payment_provider) {
      queryBuilder.andWhere(
        "paymentHistory.payment_provider = :payment_provider",
        { payment_provider },
      );
    }

    if (user_type) {
      queryBuilder.andWhere("paymentHistory.user_type = :user_type", {
        user_type,
      });
    }

    if (purchase_type) {
      queryBuilder.andWhere("paymentHistory.purchaseType = :purchase_type", {
        purchase_type,
      });
    }

    if (min_amount) {
      queryBuilder.andWhere("paymentHistory.amount >= :min_amount", {
        min_amount,
      });
    }

    if (max_amount) {
      queryBuilder.andWhere("paymentHistory.amount <= :max_amount", {
        max_amount,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        "(paymentHistory.transaction_id ILIKE :search OR user.name ILIKE :search OR user.email ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      next: hasNextPage ? page + 1 : null,
      previous: hasPreviousPage ? page - 1 : null,
    };
  }

  async findByBusiness(businessId: string) {
    return await this.paymentHistoryRepository.find({
      where: { user: { id: businessId } },
      order: { created_at: "DESC" },
    });
  }
}
