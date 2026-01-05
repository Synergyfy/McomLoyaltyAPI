import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export enum HistoryDisplayType {
  POINTS = "points",
  STAMPS = "stamps",
  BOTH = "both",
}

export class GetHistoryQueryDto extends PaginationDto {
  @ApiProperty({
    description: "Type of history to display (points, stamps, or both)",
    enum: HistoryDisplayType,
    default: HistoryDisplayType.BOTH,
    required: false,
  })
  @IsOptional()
  @IsEnum(HistoryDisplayType)
  historyType?: HistoryDisplayType = HistoryDisplayType.BOTH;
}
