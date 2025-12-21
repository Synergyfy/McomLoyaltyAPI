import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export enum OnboardingType {
  PARTNER = "partner",
  BUSINESS = "business",
}

export class NetworkOnboardingDto {
  @ApiProperty({ description: "The password for the new account" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: OnboardingType,
    description: "The type of entity to onboard as",
  })
  @IsEnum(OnboardingType)
  @IsNotEmpty()
  type: OnboardingType;

  @ApiProperty({ description: "The sector ID" })
  @IsString()
  @IsNotEmpty()
  sectorId: string;

  @ApiProperty({ description: "The category ID" })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: "The sub-category ID" })
  @IsString()
  @IsNotEmpty()
  subCategoryId: string;

  @ApiProperty({ description: "The address", required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: "The postal code" })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: "The phone number", required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
