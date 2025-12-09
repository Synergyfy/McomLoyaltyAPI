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
import { PaymentService } from '../payment/payment.service';
import { PaymentProvider } from '../payment-history/entities/payment-history.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: Repository<PaymentHistory>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    private readonly paymentService: PaymentService,
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
    const trialDays = 30; // Default trial period
    expiresAt.setDate(startsAt.getDate() + trialDays);

    let provider = PaymentProvider.STRIPE; // Default
    let transactionId = null;

    if (joinTrialDto.payment_token || joinTrialDto.provider === 'paypal') {
      // Create a subscription with trial
      const subscribeParams: any = {
        tier_id: tier.id,
        plan_type: PlanType.MONTHLY, // Default to monthly after trial
        provider: joinTrialDto.provider === 'paypal' ? PaymentProvider.PAYPAL : PaymentProvider.STRIPE,
        is_trial: true,
        trial_days: trialDays
      };

      if (joinTrialDto.payment_token) subscribeParams.payment_token = joinTrialDto.payment_token;
      if (joinTrialDto.return_url) subscribeParams.return_url = joinTrialDto.return_url;
      if (joinTrialDto.cancel_url) subscribeParams.cancel_url = joinTrialDto.cancel_url;

      const subscribeResult = await this.paymentService.subscribe(subscribeParams, user);

      if (subscribeResult.subscriptionId) {
        transactionId = subscribeResult.subscriptionId;
      }

      // If approvalUrl is present (PayPal), we return it. 
      // The membership is created as ACTIVE trial, but for PayPal it might remain pending until user approves?
      // For now, consistent with requirements, we persist it.

      if (joinTrialDto.provider === 'paypal') provider = PaymentProvider.PAYPAL;

      const membership = this.membershipRepository.create({
        business: { id: user.id } as Business,
        tier,
        plan_type: PlanType.MONTHLY,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: MembershipStatus.ACTIVE,
        is_trial: true,
        transaction_id: transactionId,
        payment_provider: provider
      });

      await this.membershipRepository.save(membership);

      return {
        ...membership,
        approvalUrl: (subscribeResult as any).approvalUrl
      };
    }

    // Fallback if no payment info provided
    const membership = this.membershipRepository.create({
      business: { id: user.id } as Business,
      tier,
      plan_type: PlanType.MONTHLY,
      starts_at: startsAt,
      expires_at: expiresAt,
      status: MembershipStatus.ACTIVE,
      is_trial: true,
    });

    await this.membershipRepository.save(membership);
    return membership;
  }
}
