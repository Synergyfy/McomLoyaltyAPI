import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyPaymentDto {
  @ApiProperty({
    description:
      "The transaction ID from the payment provider (e.g., Stripe Payment Intent ID or PayPal Order ID).",
    example: "pi_123abc...",
  })
  @IsNotEmpty()
  @IsString()
  transaction_id: string;
}
