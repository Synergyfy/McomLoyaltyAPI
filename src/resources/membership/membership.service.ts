import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
  ) {}

  async getMyMembership(user: any) {
    return await this.membershipRepository.findOne({
      where: { user_id: user.id },
      relations: ['tier'],
    });
  }

  async getMyPaymentHistory(user: any) {
    return await this.paymentHistoryRepository.find({
      where: { user_id: user.id },
      relations: ['membership'],
    });
  }
}
