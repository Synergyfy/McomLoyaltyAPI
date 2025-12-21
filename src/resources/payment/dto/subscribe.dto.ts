import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { PlanType } from "../../membership/entities/membership.entity";
import { PaymentProvider } from "../../payment-history/entities/payment-history.entity";

export class SubscribeDto {
  @ApiProperty({
    description: "The ID of the tier to subscribe to.",
    example: "clq0x0q0m0000c8f0b0a0a0a0",
  })
  @IsNotEmpty()
  @IsString()
  tier_id: string;

  @ApiProperty({
    description: "The plan type to subscribe to.",
    example: PlanType.MONTHLY,
    enum: PlanType,
  })
  @IsNotEmpty()
  @IsEnum(PlanType)
  plan_type: PlanType;

  @ApiProperty({
    description: "Payment Provider (stripe or paypal)",
    example: PaymentProvider.STRIPE,
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider: PaymentProvider = PaymentProvider.STRIPE;

  @ApiProperty({
    description: "The payment token from the frontend (Required for Stripe).",
    example: "tok_visa",
    required: false,
  })
  @ValidateIf((o) => o.provider === PaymentProvider.STRIPE)
  @IsNotEmpty()
  @IsString()
  payment_token?: string;

  @ApiProperty({
    description: "Return URL for PayPal success redirection",
    required: false,
    example: "https://example.com/success",
  })
  @ValidateIf((o) => o.provider === PaymentProvider.PAYPAL)
  @IsNotEmpty()
  @IsString()
  return_url?: string;

  @ApiProperty({
    description: "Cancel URL for PayPal cancellation redirection",
    required: false,
    example: "https://example.com/cancel",
  })
  @ValidateIf((o) => o.provider === PaymentProvider.PAYPAL)
  @IsNotEmpty()
  @IsString()
  cancel_url?: string;

  @ApiProperty({
    description: "Whether this is a trial subscription.",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_trial?: boolean;

  @ApiProperty({
    description: "Number of trial days.",
    example: 14,
    required: false,
  })
  @IsOptional()
  trial_days?: number;
}
