import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
} from "class-validator";

export class CreateStampPackageDto {
  @ApiProperty({ description: "The name of the stamp package" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "The number of stamps in the package" })
  @IsInt()
  stamps: number;

  @ApiProperty({ description: "The price of the stamp package" })
  @IsNumber()
  price: number;

  @ApiProperty({ description: "Whether the package is active", default: true })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({
    description: "Tiers that can purchase this package",
    type: [String],
  })
  @IsArray()
  @IsUUID("all", { each: true })
  tier_ids: string[];
}
