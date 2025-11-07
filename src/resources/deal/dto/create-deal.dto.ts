
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { DealType, DealAudience } from '../entities/deal.entity';

export class CreateDealDto {
  @ApiProperty({ example: 'Summer Sale' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Get 20% off on all products',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/deal.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ enum: DealType, example: DealType.DISCOUNT })
  @IsEnum(DealType)
  @IsNotEmpty()
  type: DealType;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ example: '2024-07-20T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2024-08-20T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ enum: DealAudience, example: DealAudience.ALL })
  @IsEnum(DealAudience)
  @IsNotEmpty()
  audience: DealAudience;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: 'This offer is valid for a limited time.',
    required: false,
  })
  @IsString()
  @IsOptional()
  terms?: string;
}
