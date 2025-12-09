import { IsString, IsOptional, IsBoolean, IsEmail, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBusinessDto {
  @ApiProperty({ description: 'The name of the business', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'The email of the business', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'The phone number of the business', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'The address of the business', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'The website of the business', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Social media links', required: false })
  @IsObject()
  @IsOptional()
  socialMedia?: Record<string, string>;

  @ApiProperty({ description: 'Profile image URL', required: false })
  @IsString()
  @IsOptional()
  profile_image?: string;

  @ApiProperty({ description: 'Is the business disabled?', required: false })
  @IsBoolean()
  @IsOptional()
  isDisabled?: boolean;
}