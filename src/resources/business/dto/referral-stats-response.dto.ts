import { ApiProperty } from "@nestjs/swagger";

export class ReferralStatsResponseDto {
  @ApiProperty({
    description: "The total referral capacity of the business",
    example: 100,
  })
  referralCapacity: number;

  @ApiProperty({
    description: "Number of network contacts uploaded",
    example: 25,
  })
  uploaded: number;

  @ApiProperty({ description: "Remaining referral capacity", example: 75 })
  remaining: number;

  @ApiProperty({ description: "Percentage of capacity used", example: 25.0 })
  percentage: number;
}
