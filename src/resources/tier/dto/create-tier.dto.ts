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

  @ApiProperty({
    description: 'Stripe Price ID for monthly subscription',
    required: false,
    example: 'price_12345',
  })
  @IsOptional()
  @IsString()
  stripe_monthly_price_id?: string;

  @ApiProperty({
    description: 'Stripe Price ID for quarterly subscription',
    required: false,
    example: 'price_12345',
  })
  @IsOptional()
  @IsString()
  stripe_quarterly_price_id?: string;

  @ApiProperty({
    description: 'Stripe Price ID for annual subscription',
    required: false,
    example: 'price_12345',
  })
  @IsOptional()
  @IsString()
  stripe_annual_price_id?: string;

  @ApiProperty({
    description: 'PayPal Plan ID for monthly subscription',
    required: false,
    example: 'P-12345',
  })
  @IsOptional()
  @IsString()
  paypal_monthly_plan_id?: string;

  @ApiProperty({
    description: 'PayPal Plan ID for quarterly subscription',
    required: false,
    example: 'P-12345',
  })
  @IsOptional()
  @IsString()
  paypal_quarterly_plan_id?: string;

  @ApiProperty({
    description: 'PayPal Plan ID for annual subscription',
    required: false,
    example: 'P-12345',
  })
  @IsOptional()
  @IsString()
  paypal_annual_plan_id?: string;

  @ApiProperty({
    description: 'Number of QR plaques included',
    required: false,
    default: 0,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  qrCodeCount?: number;
}
