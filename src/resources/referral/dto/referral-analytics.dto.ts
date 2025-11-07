import { ApiProperty } from '@nestjs/swagger';

class ReferredBusinessDto {
  @ApiProperty({ description: 'The name of the referred business.' })
  name: string;

  @ApiProperty({ description: 'The date the business was referred.' })
  referredAt: Date;

  @ApiProperty({ description: 'The status of the referral.' })
  status: string;
}

export class ReferralAnalyticsDto {
  @ApiProperty({ description: 'The total number of businesses invited.' })
  totalInvites: number;

  @ApiProperty({ description: 'The total number of successful referrals.' })
  totalSuccessfulReferrals: number;

  @ApiProperty({ description: 'The total number of points earned from referrals.' })
  totalPointsEarned: number;

  @ApiProperty({ description: 'A list of referred businesses.', type: [ReferredBusinessDto] })
  referredBusinesses: ReferredBusinessDto[];
}
