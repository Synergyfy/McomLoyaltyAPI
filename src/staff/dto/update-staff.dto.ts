
import { IsEmail, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStaffDto {
  @ApiProperty({ description: 'The name of the staff member.', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'The email address of the staff member.', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'The password for the staff member.', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ description: 'The URL of the avatar for the staff member.', required: false })
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
