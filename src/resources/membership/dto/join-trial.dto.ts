import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class JoinTrialDto {
  @ApiProperty({ description: "The ID of the tier to join as a trial" })
  @IsNotEmpty()
  @IsString()
  tier_id: string;

  @ApiProperty({
    description: "The payment token from the frontend (Required for Stripe).",
    example: "tok_visa",
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_token?: string;

  @ApiProperty({
    description: "Payment Provider (stripe or paypal)",
    enum: ["stripe", "paypal"],
    default: "stripe",
  })
  @IsOptional()
  @IsString()
  provider?: string = "stripe";

  @ApiProperty({
    description: "Return URL for PayPal success redirection",
    required: false,
  })
  @IsOptional()
  @IsString()
  return_url?: string;

  @ApiProperty({
    description: "Cancel URL for PayPal cancellation redirection",
    required: false,
  })
  @IsOptional()
  @IsString()
  cancel_url?: string;
}
