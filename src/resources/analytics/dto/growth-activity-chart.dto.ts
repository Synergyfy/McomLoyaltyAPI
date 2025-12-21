import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class GrowthActivityChartDto {
  @ApiPropertyOptional({
    description:
      "Start date for the chart data (YYYY-MM-DD). Defaults to 30 days ago.",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date for the chart data (YYYY-MM-DD). Defaults to today.",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GrowthActivityResponseDto {
  @ApiProperty({
    description: "Array of date labels for the x-axis.",
    example: ["2023-01-01", "2023-01-02"],
  })
  labels: string[];

  @ApiProperty({
    description: "Dataset for new registrations (business + participant).",
    example: [10, 15],
  })
  registrations: number[];

  @ApiProperty({
    description:
      "Dataset for activities (joins, earns, redeems, campaign creations).",
    example: [50, 60],
  })
  activities: number[];
}
