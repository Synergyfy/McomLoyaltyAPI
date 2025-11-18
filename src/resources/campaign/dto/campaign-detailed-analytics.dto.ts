import { ApiProperty } from '@nestjs/swagger';

class ChartDataPointDto {
  @ApiProperty({
    description: 'The date for this data point.',
    example: '2025-11-17',
  })
  date: string;

  @ApiProperty({
    description: 'The total points awarded on this date.',
    example: 500,
  })
  points_awarded: number;

  @ApiProperty({
    description: 'The total number of redemptions on this date.',
    example: 10,
  })
  redemptions: number;

  @ApiProperty({
    description: 'The number of new participants who joined on this date.',
    example: 25,
  })
  participants_joined: number;
}

export class CampaignDetailedAnalyticsDto {
  @ApiProperty({
    description: 'The total number of unique participants in the campaign.',
    example: 150,
  })
  total_participants: number;

  @ApiProperty({
    description: 'The total number of points redeemed in the campaign.',
    example: 7500,
  })
  total_points_redeemed: number;

  @ApiProperty({
    description: 'The total number of points awarded in the campaign.',
    example: 30000,
  })
  total_points_awarded: number;

  @ApiProperty({
    description: 'The redemption rate of the campaign in percentage.',
    example: 50,
  })
  redemption_rate: number;

  @ApiProperty({
    description: 'The data for the performance chart, broken down by day.',
    type: [ChartDataPointDto],
  })
  chart_data: ChartDataPointDto[];
}
