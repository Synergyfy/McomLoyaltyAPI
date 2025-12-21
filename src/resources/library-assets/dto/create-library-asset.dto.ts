import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from "class-validator";
import { LibraryAssetType } from "../entities/library-asset.entity";

export class CreateLibraryAssetDto {
  @ApiProperty({ description: "The URL of the asset file" })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: "The title of the asset" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "The description of the asset", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: LibraryAssetType, description: "The type of the asset" })
  @IsEnum(LibraryAssetType)
  type: LibraryAssetType;

  @ApiProperty({ description: "The sector ID (Admin only)", required: false })
  @IsUUID()
  @IsOptional()
  sectorId?: string;

  @ApiProperty({ description: "The category ID (Admin only)", required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: "The subcategory ID (Admin only)",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  subCategoryId?: string;
}
