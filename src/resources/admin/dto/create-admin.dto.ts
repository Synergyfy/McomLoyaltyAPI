
import { IsEmail, IsNotEmpty, IsString, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPassword } from '../../../common/validators/match-password.validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'The email address of the admin user.',
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password for the admin account.',
    example: 'strongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Confirm the password for the admin account.',
    example: 'strongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(MatchPassword, ['password'])
  confirmPassword: string;
}
