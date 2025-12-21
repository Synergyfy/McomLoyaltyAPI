import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsDateString, IsEnum } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { PointHistoryType } from "../../participant-campaign-balance/entities/point-history.entity";

export class PointLogFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Start date for the logs" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "End date for the logs" })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Type of transaction",
    enum: PointHistoryType,
  })
  @IsOptional()
  @IsEnum(PointHistoryType)
  transactionType?: PointHistoryType;

  @ApiPropertyOptional({ description: "ID of the business" })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: "ID of the campaign" })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: "ID of the participant" })
  @IsOptional()
  @IsString()
  participantId?: string;
}
