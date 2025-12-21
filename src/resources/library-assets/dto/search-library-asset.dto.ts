import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { LibraryAssetType } from "../entities/library-asset.entity";

export enum AssetSource {
  MINE = "MINE",
  ADMIN = "ADMIN",
  ALL = "ALL",
}

export class SearchLibraryAssetDto extends PaginationDto {
  @ApiProperty({
    description: "Search by title or description",
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    enum: LibraryAssetType,
    description: "Filter by asset type",
    required: false,
  })
  @IsEnum(LibraryAssetType)
  @IsOptional()
  type?: LibraryAssetType;

  @ApiProperty({ description: "Filter by sector ID", required: false })
  @IsUUID()
  @IsOptional()
  sectorId?: string;

  @ApiProperty({ description: "Filter by category ID", required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: "Filter by subcategory ID", required: false })
  @IsUUID()
  @IsOptional()
  subCategoryId?: string;

  @ApiProperty({
    enum: AssetSource,
    description: "Source of assets (MINE, ADMIN, ALL)",
    default: AssetSource.ALL,
    required: false,
  })
  @IsEnum(AssetSource)
  @IsOptional()
  source?: AssetSource;
}
