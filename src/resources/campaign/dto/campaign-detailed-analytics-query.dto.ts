import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum DateRange {
  SevenDays = '7days',
  ThirtyDays = '30days',
  AllTime = 'all_time',
}

export class CampaignDetailedAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'The date range for the chart data.',
    enum: DateRange,
    default: DateRange.SevenDays,
  })
  @IsEnum(DateRange)
  @IsOptional()
  range?: DateRange = DateRange.SevenDays;
}
