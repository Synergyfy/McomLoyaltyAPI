import { IsNotEmpty, IsNumber } from 'class-validator';

export class MarkForSaleDto {
  @IsNotEmpty()
  @IsNumber()
  price: number;
}
