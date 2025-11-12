
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ example: 'Summer Sale', description: 'The title of the deal' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Get 50% off on all items', description: 'A short description of the deal' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://example.com/deal.jpg', description: 'The URL of the deal image' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'f8b5a8a0-7b3b-4e4a-8b0a-3a7f6b2b6b5e', description: 'The ID of the deal category' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 20.0, description: 'The monetary value of the deal' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2024-12-31', description: 'The start date of the deal' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ example: '2025-01-31', description: 'The end date of the deal' })
  @IsDateString()
  endDate: Date;

  @ApiProperty({ example: 'This offer is valid for a limited time only.', description: 'The terms and conditions of the deal' })
  @IsString()
  @IsNotEmpty()
  termsAndConditions: string;
}
