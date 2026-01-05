import { ApiProperty } from "@nestjs/swagger";

export class DataPerTierDto {
  @ApiProperty({
    description: "The unique identifier of the tier.",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  tierId: string;

  @ApiProperty({
    description: "The name of the tier.",
    example: "Silver",
  })
  tierName: string;

  @ApiProperty({
    description:
      "The number of businesses in this tier that claimed the campaign.",
    example: 10,
  })
  claimsCount: number;

  @ApiProperty({
    description:
      "The total number of participants across all businesses in this tier.",
    example: 150,
  })
  totalParticipants: number;

  @ApiProperty({
    description: "The total points earned by participants in this tier.",
    example: 5000,
  })
  totalPointsEarned: number;

  @ApiProperty({
    description: "The total points redeemed by participants in this tier.",
    example: 1000,
  })
  totalPointsRedeemed: number;
}

export class TierAnalyticsResponseDto {
  @ApiProperty({
    description: "Analytics data grouped by tier.",
    type: [DataPerTierDto],
  })
  data: DataPerTierDto[];
}
