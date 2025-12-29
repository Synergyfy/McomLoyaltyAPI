import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateNetworkDto {
  @ApiProperty({ description: "Full name of the contact" })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: "Business name" })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: "Email address" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "Phone number" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    description: "Permission to share information",
    default: false,
  })
  @IsOptional()
  hasPermission?: boolean;
}
