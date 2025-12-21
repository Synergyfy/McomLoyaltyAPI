import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum ChartPeriod {
  SEVEN_DAYS = "7d",
  THIRTY_DAYS = "30d",
  THREE_MONTHS = "3m",
  SIX_MONTHS = "6m",
  ONE_YEAR = "1y",
}

export class ChartQueryDto {
  @ApiProperty({
    enum: ChartPeriod,
    default: ChartPeriod.THIRTY_DAYS,
    required: false,
  })
  @IsEnum(ChartPeriod)
  @IsOptional()
  period: ChartPeriod = ChartPeriod.THIRTY_DAYS;
}

export class ChartData {
  @ApiProperty()
  date: string;

  @ApiProperty()
  pointsEarned: number;

  @ApiProperty()
  pointsRedeemed: number;
}

export class ChartResponseDto {
  @ApiProperty({ type: [ChartData] })
  data: ChartData[];
}
