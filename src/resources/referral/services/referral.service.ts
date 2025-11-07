import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from '../entities/referral.entity';
import { ReferralAnalyticsDto } from '../dto/referral-analytics.dto';
import { Business } from '../../business/entities/business.entity';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
  ) {}

  async getReferralAnalytics(referrerId: string): Promise<ReferralAnalyticsDto> {
    const referrals = await this.referralRepository.find({
      where: { referrer: { id: referrerId } },
      relations: ['referred'],
    });

    const totalInvites = referrals.length;
    const successfulReferrals = referrals.filter(
      (referral) => referral.status === ReferralStatus.COMPLETED,
    );
    const totalSuccessfulReferrals = successfulReferrals.length;
    const totalPointsEarned = totalSuccessfulReferrals * 100;

    const referredBusinesses = referrals.map((referral) => ({
      name: referral.referred.name,
      referredAt: referral.created_at,
      status: referral.status,
    }));

    return {
      totalInvites,
      totalSuccessfulReferrals,
      totalPointsEarned,
      referredBusinesses,
    };
  }
}
