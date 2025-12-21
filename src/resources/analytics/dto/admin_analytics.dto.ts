import { ApiProperty } from "@nestjs/swagger";

export class SystemOverviewDto {
  @ApiProperty({
    example: 150,
    description: "Total number of campaigns created.",
  })
  totalCampaigns: number;

  @ApiProperty({
    example: 85,
    description:
      "Total number of participants who have joined at least one campaign.",
  })
  totalParticipants: number;

  @ApiProperty({
    example: 520,
    description: "Total number of rewards redeemed across all campaigns.",
  })
  totalRedemptions: number;

  @ApiProperty({
    example: 50,
    description: "Total number of businesses registered.",
  })
  totalBusiness: number;

  @ApiProperty({
    example: 1000,
    description: "Total number of matching points given.",
  })
  totalMatchingPoints: number;
}

export class TopBusinessDto {
  @ApiProperty({
    example: "uuid-of-business",
    description: "The unique identifier for the business.",
  })
  id: string;

  @ApiProperty({
    example: "Tech Innovations Inc.",
    description: "The name of the business.",
  })
  name: string;

  @ApiProperty({
    example: 12500,
    description:
      "Total points earned by participants in the business's campaigns.",
  })
  totalPointsEarned: number;

  @ApiProperty({
    example: 7800,
    description:
      "Total points redeemed for rewards in the business's campaigns.",
  })
  totalPointsRedeemed: number;
}

export class TopRewardDto {
  @ApiProperty({
    example: "uuid-of-reward",
    description: "The unique identifier for the reward.",
  })
  id: string;

  @ApiProperty({
    example: "Free Coffee",
    description: "The name of the reward.",
  })
  name: string;

  @ApiProperty({
    example: 250,
    description: "The total number of times this reward has been redeemed.",
  })
  totalRedemptions: number;
}
