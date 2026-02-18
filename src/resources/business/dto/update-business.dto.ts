import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsObject,
  IsUUID,
  IsUrl,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateBusinessDto {
  @ApiProperty({ description: "The first name of the business owner", required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: "The last name of the business owner", required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: "The email of the business", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "The phone number of the business",
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "The address of the business", required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: "The website of the business", required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: "Social media links", required: false })
  @IsObject()
  @IsOptional()
  socialMedia?: Record<string, string>;

  @ApiProperty({ description: "Profile image URL", required: false })
  @IsUrl()
  @IsOptional()
  profile_image?: string;

  @ApiProperty({ description: "Banner image URL", required: false })
  @IsUrl()
  @IsOptional()
  banner?: string;

  @ApiProperty({ description: "Sector ID", required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  sector?: string;

  @ApiProperty({ description: "Category ID", required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  category?: string;

  @ApiProperty({ description: "SubCategory ID", required: false })
  @IsString()
  @IsOptional()
  @IsUUID()
  subCategory?: string;

  @ApiProperty({ description: "Is the business disabled?", required: false })
  @IsBoolean()
  @IsOptional()
  isDisabled?: boolean;
}
