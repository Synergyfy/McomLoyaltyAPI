
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Membership, MembershipStatus } from '../resources/membership/entities/membership.entity';
import { LessThan, Repository } from 'typeorm';
import { Business } from '../resources/business/entities/business.entity';
import { StripeService } from '../resources/payment/stripe.service';
import { PaymentService } from '../resources/payment/payment.service';
import { PlanType } from '../resources/membership/entities/membership.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTrialConversions() {
    const expiringTrials = await this.membershipRepository.find({
      where: {
        is_trial: true,
        status: MembershipStatus.ACTIVE,
        expires_at: LessThan(new Date()),
      },
      relations: ['tier'],
    });

    for (const trial of expiringTrials) {
      const business = await this.businessRepository.findOne({ where: { id: trial.user_id } });
      if (business && business.stripe_customer_id) {
        try {
          const amount = this.paymentService['_calculateAmountForSubscription'](trial.tier, trial.plan_type);
          const charge = await this.stripeService.createCharge(
            amount * 100,
            'gbp',
            business.stripe_customer_id,
            `Subscription to ${trial.tier.name} (${trial.plan_type})`,
          );

          if (charge.status === 'succeeded') {
            const expiresAt = new Date();
            if (trial.plan_type === PlanType.ANNUAL) {
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            } else if (trial.plan_type === PlanType.QUARTERLY) {
              expiresAt.setMonth(expiresAt.getMonth() + 3);
            } else {
              expiresAt.setMonth(expiresAt.getMonth() + 1);
            }

            await this.paymentService['_createOrUpdateMembership'](
              business,
              trial.tier,
              trial.plan_type,
              amount,
              'stripe',
              charge.id,
              false,
              expiresAt,
            );
          } else {
            trial.status = MembershipStatus.EXPIRED;
            await this.membershipRepository.save(trial);
          }
        } catch (error) {
          trial.status = MembershipStatus.EXPIRED;
          await this.membershipRepository.save(trial);
        }
      } else {
        trial.status = MembershipStatus.EXPIRED;
        await this.membershipRepository.save(trial);
      }
    }
  }
}
