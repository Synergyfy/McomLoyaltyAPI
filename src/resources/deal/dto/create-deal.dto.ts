import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsDateString,
  IsNumber,
  Min,
  Validate,
  IsEnum,
  IsArray,
  IsInt,
} from "class-validator";
import { IsDateAfter } from "../validators/is-date-after.validator";
import { DealType } from "../enums/deal-type.enum";
import { RedemptionMethod } from "../enums/redemption-method.enum";
import { DealVisibility } from "../enums/deal-visibility.enum";

export class CreateDealDto {
  @ApiProperty({ example: "Summer Sale", description: "The title of the deal" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: "Get 50% off on all items",
    description: "A short description of the deal",
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: "https://example.com/deal.jpg",
    description: "The URL of the deal image",
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: "f8b5a8a0-7b3b-4e4a-8b0a-3a7f6b2b6b5e",
    description: "The ID of the deal category",
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 20.0, description: "The monetary value of the deal" })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    example: "2024-12-31",
    description: "The start date of the deal",
  })
  @IsDateString()
  startDate: Date;

  @ApiProperty({
    example: "2025-01-31",
    description: "The end date of the deal",
  })
  @IsDateString()
  @Validate(IsDateAfter, ["startDate"])
  endDate: Date;

  @ApiProperty({
    example: "This offer is valid for a limited time only.",
    description: "The terms and conditions of the deal",
  })
  @IsString()
  @IsNotEmpty()
  termsAndConditions: string;

  @ApiProperty({
    example: "Get 50% off",
    description: "A short description of the deal",
  })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({
    enum: DealType,
    example: DealType.DISCOUNT,
    description: "The type of the deal",
  })
  @IsEnum(DealType)
  @IsOptional()
  type?: DealType;

  @ApiProperty({
    example: ["https://example.com/image1.jpg"],
    description: "Array of image URLs",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    example: ["https://example.com/gallery1.jpg"],
    description: "Array of gallery image URLs",
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryImages?: string[];

  @ApiProperty({
    example: 100.0,
    description: "The original price before discount",
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @ApiProperty({ example: 50.0, description: "The price of the deal" })
  @IsNumber()
  @Min(0)
  dealPrice: number;

  @ApiProperty({
    example: 100,
    description: "Maximum quantity available",
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxQuantity?: number;

  @ApiProperty({
    example: 1,
    description: "Limit per customer",
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  perCustomerLimit?: number;

  @ApiProperty({
    enum: RedemptionMethod,
    example: RedemptionMethod.QR_SCAN,
    description: "Method of redemption",
  })
  @IsEnum(RedemptionMethod)
  @IsOptional()
  redemptionMethod?: RedemptionMethod;

  @ApiProperty({
    example: "New York, NY",
    description: "Location of the deal",
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    enum: DealVisibility,
    example: DealVisibility.PUBLIC,
    description: "Visibility of the deal",
  })
  @IsEnum(DealVisibility)
  @IsOptional()
  visibility?: DealVisibility;

  @ApiProperty({
    example: false,
    description: "Whether this deal can be redeemed with points",
  })
  @IsOptional()
  isReward?: boolean;

  @ApiProperty({
    example: 500,
    description: "Points required to redeem this deal",
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pointsCost?: number;

  @ApiProperty({
    example: 50,
    description: "Points earned when purchasing this deal",
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pointsEarned?: number;
}
