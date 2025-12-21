import { ApiProperty } from "@nestjs/swagger";

export class PointPurchaseConfigDto {
  @ApiProperty({
    description: "Maximum number of points the business can purchase currently",
    example: 500,
  })
  maxBuyablePoints: number;

  @ApiProperty({ description: "Cost per point", example: 0.1 })
  costPerPoint: number;

  @ApiProperty({ description: "Currency code", example: "GBP" })
  currency: string;
}
