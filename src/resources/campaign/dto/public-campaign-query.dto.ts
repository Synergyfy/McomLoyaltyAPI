import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export enum CampaignSortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class PublicCampaignQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by Sector ID" })
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @ApiPropertyOptional({ description: "Filter by Category ID" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Filter by SubCategory ID" })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiPropertyOptional({ description: "Search by campaign name" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort by creation date",
    enum: CampaignSortOrder,
    default: CampaignSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(CampaignSortOrder)
  sort?: CampaignSortOrder = CampaignSortOrder.DESC;
}
