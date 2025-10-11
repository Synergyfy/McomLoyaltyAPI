
import { IsEmail, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStaffDto {
  @ApiProperty({ description: 'The name of the staff member.', required: false, example: 'Johnathan Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'The email address of the staff member.', required: false, example: 'john.doe@new-email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'The new password for the staff member account.', required: false, example: 'newStrongPassword456' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ description: 'The URL of the avatar for the staff member.', required: false, example: 'https://example.com/new-avatar.png' })
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
