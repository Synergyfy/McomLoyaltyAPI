import { IsNotEmpty, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateTierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  monthly_price: number;

  @IsNotEmpty()
  @IsNumber()
  annual_price: number;

  @IsNotEmpty()
  @IsArray()
  features: string[];
}
