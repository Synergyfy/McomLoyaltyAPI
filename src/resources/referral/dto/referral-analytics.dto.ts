import { ApiProperty } from '@nestjs/swagger';

class ReferredBusinessDto {
  @ApiProperty({ description: 'The name of the referred business.' })
  @ApiProperty({ description: 'The email of the referred business if not fully signed up.' })
  email?: string;

  @ApiProperty({ description: 'The points earned from this referral.' })
  pointsEarned: number;
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

  @ApiProperty({ description: 'Current page number.' })
  page: number;

  @ApiProperty({ description: 'Items per page.' })
  limit: number;

  @ApiProperty({ description: 'Total number of items.' })
  total: number;

  @ApiProperty({ description: 'Total number of pages.' })
  totalPages: number;
}
