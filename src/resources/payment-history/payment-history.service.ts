import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentHistory } from './entities/payment-history.entity';
import { PaymentHistoryQueryDto } from './dto/payment-history-query.dto';

@Injectable()
export class PaymentHistoryService {
  constructor(
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
  ) { }

  async findAll(query: PaymentHistoryQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.paymentHistoryRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

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
      order: { created_at: 'DESC' },
    });
  }
}
