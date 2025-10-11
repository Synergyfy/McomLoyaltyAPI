
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ description: 'The name of the staff member.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The email address of the staff member.' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The password for the staff member.' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'The URL of the avatar for the staff member.', required: false })
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
