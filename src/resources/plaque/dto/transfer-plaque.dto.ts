import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransferPlaqueDto {
  @IsNotEmpty()
  @IsUUID()
  to_owner_id: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  invoice_id?: string;
}
