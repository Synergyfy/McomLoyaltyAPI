import { IsNotEmpty, IsString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTierDto {
  @ApiProperty({
    description: 'The name of the membership tier.',
    example: 'Bronze',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The monthly price of the tier.',
    example: 45,
  })
  @IsNotEmpty()
  @IsNumber()
  monthly_price: number;

  @ApiProperty({
    description: 'The annual price of the tier.',
    example: 540,
  })
  @IsNotEmpty()
  @IsNumber()
  annual_price: number;

  @ApiProperty({
    description: 'A list of features included in the tier.',
    example: ['Basic support', '10 QR codes'],
  })
  @IsNotEmpty()
  @IsArray()
  features: string[];
}
