import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsInt, Min, IsOptional, IsString } from "class-validator";

export class PurchaseDealDto {
  @ApiProperty({ description: "The ID of the deal to purchase" })
  @IsUUID()
  dealId: string;

  @ApiProperty({ description: "Quantity to purchase", default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: "Payment method (optional for now)",
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
