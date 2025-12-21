import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ConfirmPointPurchaseDto {
  @ApiProperty({
    description: "Transaction ID (PaymentIntent ID or Order ID)",
    example: "pi_1234567890",
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: "Payment provider",
    example: "stripe",
    enum: ["stripe", "paypal"],
  })
  @IsString()
  @IsNotEmpty()
  provider: string;
}
