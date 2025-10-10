
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  sector: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  socialMedia?: Record<string, string>;
}
