import { ApiProperty } from "@nestjs/swagger";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";
import { ReferralStatus } from "../entities/referral.entity";

class ReferredBusinessDto {
  @ApiProperty({ description: "The ID of the business." })
  businessId?: string;

  @ApiProperty({ description: "The name of the referred business." })
  name: string;

  @ApiProperty({
    description: "The email of the referred business if not fully signed up.",
  })
  email?: string;

  @ApiProperty({ description: "The date when the referral was created." })
  referredAt: Date;

  @ApiProperty({
    description: "The status of the referral.",
    enum: ReferralStatus,
  })
  status: ReferralStatus;

  @ApiProperty({ description: "The points earned from this referral." })
  pointsEarned: number;

  @ApiProperty({
    description: "The location tag of the business.",
    enum: NetworkLocationTag,
    required: false,
  })
  locationTag?: NetworkLocationTag;

  @ApiProperty({
    description: "The relationship tag of the business.",
    enum: NetworkRelationshipTag,
    required: false,
  })
  relationshipTag?: NetworkRelationshipTag;
}

export class ReferralAnalyticsDto {
  @ApiProperty({ description: "The total number of businesses invited." })
  totalInvites: number;

  @ApiProperty({ description: "The total number of successful referrals." })
  totalSuccessfulReferrals: number;

  @ApiProperty({
    description: "The total number of points earned from referrals.",
  })
  totalPointsEarned: number;

  @ApiProperty({
    description: "A list of referred businesses.",
    type: [ReferredBusinessDto],
  })
  referredBusinesses: ReferredBusinessDto[];

  @ApiProperty({ description: "Current page number." })
  page: number;

  @ApiProperty({ description: "Items per page." })
  limit: number;

  @ApiProperty({ description: "Total number of items." })
  total: number;

  @ApiProperty({ description: "Total number of pages." })
  totalPages: number;
}
