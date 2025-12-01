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
  ) { }

  async findOneByBusinessId(businessId: string) {
    return await this.membershipRepository.findOne({
      where: { business: { id: businessId } },
      relations: ['tier'],
    });
  }

  async getMyMembership(user: any) {
    return await this.membershipRepository.findOne({
      where: { business: { id: user.id } },
      relations: ['tier'],
    });
  }

  async getMyPaymentHistory(user: any) {
    return await this.paymentHistoryRepository.find({
      where: { user: { id: user.id } },
      relations: ['membership'],
    });
  }

  async updateProgressionLevel(id: string, level: 'basic' | 'pro' | 'pro_plus') {
    await this.membershipRepository.update(id, { progression_level: level });
  }

  async remove(id: string) {
    await this.membershipRepository.softDelete(id);
  }
}
