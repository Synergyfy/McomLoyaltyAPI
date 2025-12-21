import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { MatchingPointActivityType } from "../entities/matching-point-config.entity";

export class GetMatchingPointHistoryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: MatchingPointActivityType,
    description: "Filter by activity type",
  })
  @IsOptional()
  @IsEnum(MatchingPointActivityType)
  activity_type?: MatchingPointActivityType;

  @ApiPropertyOptional({ description: "Search by description" })
  @IsOptional()
  @IsString()
  search?: string;
}
