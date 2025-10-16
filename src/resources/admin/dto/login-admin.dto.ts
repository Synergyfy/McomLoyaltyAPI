import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginAdminDto {
  @ApiProperty({
    description: 'The email of the admin.',
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password of the admin.',
    example: 'adminPassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}