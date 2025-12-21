import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePointPackageDto {
  @ApiProperty({ description: "Name of the point package" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Description of the point package",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Number of points in the package" })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ description: "Price of the package" })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: "Currency of the price",
    default: "GBP",
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: "Array of Tier IDs that can purchase this package",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tier_ids: string[];

  @ApiProperty({
    description: "Whether the package is active",
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
