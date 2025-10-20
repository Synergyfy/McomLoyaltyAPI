import { IsString, IsNotEmpty, IsOptional, IsUrl, IsUUID, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty({ description: 'The primary phone number for the business.', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'The physical address of the business.', example: '123 Foodie Lane, Culinary City' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'The UUID of the sector/industry the business belongs to.', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  @IsNotEmpty()
  sectorId: string;

  @ApiProperty({ description: "The URL of the business's official website.", example: 'https://gourmetkitchen.com', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'A JSON object containing links to social media profiles.', example: { facebook: 'https://facebook.com/gourmetkitchen' }, required: false })
  @IsOptional()
  socialMedia?: Record<string, any>;

  @ApiProperty({ description: 'The number of businesses they can refer.', example: 10 })
  @IsInt()
  @IsNotEmpty()
  referralCapacity: number;
}
