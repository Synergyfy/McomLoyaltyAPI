import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
} from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { QrPlaqueStatus } from "../entities/qr-plaque.entity";
import { Transform } from "class-transformer";

export enum PlaqueSortOption {
  NEWEST = "NEWEST",
  OLDEST = "OLDEST",
}

export class QrPlaqueQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Search term for name or description",
    example: "Reception",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by one or more statuses",
    enum: QrPlaqueStatus,
    isArray: true,
    example: [QrPlaqueStatus.ACTIVE, QrPlaqueStatus.PENDING],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") return value.split(",");
    return value;
  })
  @IsEnum(QrPlaqueStatus, { each: true })
  status?: QrPlaqueStatus[];

  @ApiPropertyOptional({
    description: "Filter by start date (YYYY-MM-DD)",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Filter by end date (YYYY-MM-DD)",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: PlaqueSortOption,
    default: PlaqueSortOption.NEWEST,
  })
  @IsOptional()
  @IsEnum(PlaqueSortOption)
  sort?: PlaqueSortOption = PlaqueSortOption.NEWEST;
}
