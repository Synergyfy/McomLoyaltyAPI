import { IsNotEmpty, IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PaymentProviderType } from "./initiate-wallet-topup.dto";

export class VerifyWalletTopupDto {
  @ApiProperty({
    description: "The transaction ID from the payment provider.",
    example: "pi_123abc...",
  })
  @IsNotEmpty()
  @IsString()
  transaction_id: string;

  @ApiProperty({
    description: "Payment provider",
    enum: PaymentProviderType,
    example: PaymentProviderType.STRIPE,
  })
  @IsNotEmpty()
  @IsEnum(PaymentProviderType)
  provider: string;
}
