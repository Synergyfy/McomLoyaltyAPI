import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
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
}