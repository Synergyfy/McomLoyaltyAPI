import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  ValidateIf,
  IsEmail,
  IsPhoneNumber,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Relationship,
  Occasion,
  Season,
  Priority,
} from "../entities/wishlist-enums";
import { IsOneOfTwoRequired } from "../../../common/decorators/is-one-of-two-required.decorator";

export class CreateWishlistDto {
  @ApiProperty({ example: "Running Shoes" })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ example: "https://example.com/shoes.jpg" })
  @IsUrl()
  @IsOptional()
  itemImageUrl?: string;

  @ApiProperty({ example: "a1b2c3d4-e5f6-7890-1234-567890abcdef" })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ enum: Occasion, example: Occasion.BIRTHDAY })
  @IsEnum(Occasion)
  @IsOptional()
  occasion?: Occasion;

  @ApiPropertyOptional({ enum: Season, example: Season.SUMMER })
  @IsEnum(Season)
  @IsOptional()
  season?: Season;

  @ApiPropertyOptional({ example: "2024-12-25" })
  @IsDateString()
  @IsOptional()
  targetDate?: Date;

  @ApiPropertyOptional({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({
    description: "User must opt-in to receive offers for this item",
    example: true,
  })
  @IsBoolean()
  marketingConsent: boolean;

  @ApiProperty({
    description: "Flag to determine if the item is for a third party",
    example: false,
  })
  @IsBoolean()
  isForThirdParty: boolean;

  @ApiPropertyOptional({
    description: "Required if isForThirdParty is true",
    example: "John Doe",
  })
  @ValidateIf((o) => o.isForThirdParty)
  @IsString()
  @IsNotEmpty()
  recipientName?: string;

  @ApiPropertyOptional({
    description:
      "Required if isForThirdParty is true and recipientPhone is not provided",
    example: "john.doe@example.com",
  })
  @ValidateIf((o) => o.isForThirdParty)
  @IsEmail()
  @IsOptional()
  @IsOneOfTwoRequired("recipientPhone")
  recipientEmail?: string;

  @ApiPropertyOptional({
    description:
      "Required if isForThirdParty is true and recipientEmail is not provided",
    example: "+15551234567",
  })
  @ValidateIf((o) => o.isForThirdParty)
  @IsPhoneNumber(null)
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional({
    description: "Required if isForThirdParty is true",
    enum: Relationship,
    example: Relationship.BROTHER,
  })
  @ValidateIf((o) => o.isForThirdParty)
  @IsEnum(Relationship)
  @IsNotEmpty()
  relationship?: Relationship;
}
