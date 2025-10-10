
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsNotEmpty()
  sectorId: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  socialMedia?: Record<string, string>;
}
