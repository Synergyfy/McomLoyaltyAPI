import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsUUID, Min } from "class-validator";

export class DealAnalyticsDto {
  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  uniqueViews: number;

  @ApiProperty()
  averageTimeSpentSeconds: number;

  @ApiProperty()
  osBreakdown: Record<string, number>;

  @ApiProperty()
  deviceBreakdown: Record<string, number>;

  @ApiProperty()
  browserBreakdown: Record<string, number>;

  @ApiProperty()
  recentViews: { date: string; count: number }[];
}

export class RecordTimeSpentDto {
  @ApiProperty()
  @IsUUID()
  analyticsId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  durationSeconds: number;
}
