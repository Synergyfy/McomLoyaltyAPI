import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPasswordMatching } from '../../../common/decorators/validation/is-password-matching.decorator';

export class CreateBusinessDto {
  @ApiProperty({ description: 'The legal name of the business.', example: 'The Gourmet Kitchen' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The contact email for the business.', example: 'contact@gourmetkitchen.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password for the business account.', example: 'aStrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'The password confirmation.',
    example: 'aStrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @IsPasswordMatching('password', { message: 'Passwords do not match' })
  confirmPassword: string;

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
  socialMedia?: Record<string, string>;
}