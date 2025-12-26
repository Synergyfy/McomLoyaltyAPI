import { IsNotEmpty, IsNumber, IsEnum, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum PaymentProviderType {
  STRIPE = "stripe",
  PAYPAL = "paypal",
}

export class InitiateWalletTopupDto {
  @ApiProperty({
    description: "Amount to top up",
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: "Payment provider",
    enum: PaymentProviderType,
    example: PaymentProviderType.STRIPE,
  })
  @IsNotEmpty()
  @IsEnum(PaymentProviderType)
  provider: string;
}
