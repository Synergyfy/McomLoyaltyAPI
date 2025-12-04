import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { PaymentHistory } from '../payment-history/entities/payment-history.entity';
import { Tier } from '../tier/entities/tier.entity';
import { JoinTrialDto } from './dto/join-trial.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Business } from '../business/entities/business.entity';
import { MembershipStatus, PlanType } from './entities/membership.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
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

  async joinTrial(user: any, joinTrialDto: JoinTrialDto) {
    // Check if membership already exists
    const existingMembership = await this.membershipRepository.findOne({
      where: { business: { id: user.id } },
    });

    if (existingMembership) {
      throw new BadRequestException('Membership already exists');
    }

    const tier = await this.tierRepository.findOne({ where: { id: joinTrialDto.tier_id } });
    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(startsAt.getDate() + 30);

    const membership = this.membershipRepository.create({
      business: { id: user.id } as Business,
      tier,
      plan_type: PlanType.MONTHLY, // Default to monthly for trial? Or maybe irrelevant.
      starts_at: startsAt,
      expires_at: expiresAt,
      status: MembershipStatus.ACTIVE,
      is_trial: true,
    });

    await this.membershipRepository.save(membership);
    return membership;
  }
}
