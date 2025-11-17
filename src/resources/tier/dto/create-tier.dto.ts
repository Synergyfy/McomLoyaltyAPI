import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TierStatus } from '../entities/tier-status.enum';

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
    description: 'The quarterly price of the tier.',
    example: 135,
  })
  @IsNotEmpty()
  @IsNumber()
  quaterly_price: number;

  @ApiProperty({
    description: 'A list of features included in the tier.',
    example: ['Basic support', '10 QR codes'],
  })
  @IsNotEmpty()
  @IsArray()
  features: string[];

  @ApiProperty({
    description: 'The status of the tier.',
    example: TierStatus.PUBLISHED,
    enum: TierStatus,
    default: TierStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(TierStatus)
  status: TierStatus;
}
