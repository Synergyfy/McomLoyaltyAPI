import {
  IsNumber,
  IsString,
  Min,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class BuyPointsDto {
  @ApiProperty({ description: "Number of points to purchase", example: 100 })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({
    description: "Payment provider",
    example: "stripe",
    enum: ["stripe", "paypal"],
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({
    description: "Payment method ID or token (optional, for Stripe)",
    example: "pm_card_visa",
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
