import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { DealStatus } from "../enums/deal-status.enum";
import { DealType } from "../enums/deal-type.enum";
import { IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class FilterDealDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: DealStatus,
    description: "Filter by deal status",
  })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional({ description: "Search by deal title or description" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by category ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Filter by location" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: "Filter by minimum price" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Filter by maximum price" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: DealType, description: "Filter by deal type" })
  @IsOptional()
  @IsEnum(DealType)
  type?: DealType;
}
