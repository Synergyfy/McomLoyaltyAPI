import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SystemOverviewDto {
  @ApiProperty({ example: 150 })
  totalBusinesses: number;

  @ApiProperty({ example: 5000 })
  totalCustomers: number;

  @ApiProperty({ example: 50 })
  totalActiveCampaigns: number;

  @ApiProperty({ example: 1200 })
  totalRewardsClaimed: number;
}

export class CustomerActivityGrowthQueryDto {
  @ApiProperty({
    description: 'Number of days to look back for analytics.',
    default: 30,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 30;
}

class DailyDataDto {
  @ApiProperty({ example: '2024-10-27' })
  date: string;

  @ApiProperty({ example: 100 })
  pointsEarned: number;

  @ApiProperty({ example: 50 })
  pointsRedeemed: number;
}

class GrowthDataDto {
  @ApiProperty({ example: '2024-10-27' })
  date: string;

  @ApiProperty({ example: 10 })
  newCustomers: number;
}

export class CustomerActivityGrowthDto {
  @ApiProperty({ type: [DailyDataDto] })
  activity: DailyDataDto[];

  @ApiProperty({ type: [GrowthDataDto] })
  growth: GrowthDataDto[];
}


export class TopBusinessDto {
    @ApiProperty({ example: 'uuid-of-business' })
    businessId: string;

    @ApiProperty({ example: 'Awesome Inc.' })
    businessName: string;

    @ApiProperty({ example: 500 })
    totalRewardsRedeemed: number;

    @ApiProperty({ example: 10000 })
    totalPointsIssued: number;
  }

  export class TopBusinessesResponseDto {
      @ApiProperty({ type: [TopBusinessDto] })
      ranking: TopBusinessDto[]
  }
