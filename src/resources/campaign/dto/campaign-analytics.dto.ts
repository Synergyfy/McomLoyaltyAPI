import { ApiProperty } from '@nestjs/swagger';

export class CampaignAnalyticsDto {
  @ApiProperty({
    description: 'The name of the campaign.',
    example: 'Summer Sale Campaign',
  })
  name: string;

  @ApiProperty({
    description: "The sector of the business running the campaign.",
    example: 'Retail',
  })
  sector: string;

  @ApiProperty({
    description: 'The status of the campaign.',
    example: 'Active',
  })
  status: string;

  @ApiProperty({
    description: 'The total number of unique participants in the campaign.',
    example: 150,
  })
  total_participants: number;

  @ApiProperty({
    description: 'The total number of rewards redeemed in the campaign.',
    example: 75,
  })
  total_reward_redeemed: number;

  @ApiProperty({
    description: 'The total points awarded in the campaign.',
    example: 3000,
  })
  total_point_awarded: number;

  @ApiProperty({
    description: 'The redemption rate of the campaign in percentage.',
    example: 50,
  })
  redemption_rate: number;
}
