import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsNotEmpty()
  @IsString()
  transaction_id: string;
}
