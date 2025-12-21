import { IsNotEmpty, IsString, IsEnum, IsNumber } from "class-validator";
import {
  PaymentProvider,
  PaymentStatus,
} from "../entities/payment-history.entity";

export class CreatePaymentHistoryDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  user_type: string;

  @IsNotEmpty()
  @IsString()
  membership_id: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  payment_provider: PaymentProvider;

  @IsNotEmpty()
  @IsString()
  transaction_id: string;

  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
