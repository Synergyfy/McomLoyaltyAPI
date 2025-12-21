import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsUUID,
  IsInt,
  IsIn,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OnboardingDto {
  @ApiProperty({
    description: "The primary phone number for the business.",
    example: "+1234567890",
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: "The physical address of the business.",
    example: "123 Foodie Lane, Culinary City",
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: "The postal code of the business.",
    example: "12345",
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({
    description: "The UUID of the sector the business belongs to.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsUUID()
  @IsNotEmpty()
  sectorId: string;

  @ApiProperty({
    description: "The UUID of the category the business belongs to.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: "The UUID of the subcategory the business belongs to.",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiProperty({
    description: "The URL of the business's official website.",
    example: "https://gourmetkitchen.com",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: "A JSON object containing links to social media profiles.",
    example: { facebook: "https://facebook.com/gourmetkitchen" },
    required: false,
  })
  @IsOptional()
  socialMedia?: Record<string, any>;

  @ApiProperty({
    description: "The number of businesses they can refer.",
    example: "12+",
  })
  @IsString()
  @IsIn(["12+", "25+", "50+", "100+"])
  @IsNotEmpty()
  referralCapacity: string;
}
