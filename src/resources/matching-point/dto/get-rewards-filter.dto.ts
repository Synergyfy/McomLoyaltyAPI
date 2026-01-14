import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { TargetAudience } from "../entities/matching-point-reward.entity";
import { Type } from "class-transformer";

export class GetMatchingPointRewardsFilterDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  min_points?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  max_points?: number;

  @ApiProperty({ enum: TargetAudience, required: false })
  @IsEnum(TargetAudience)
  @IsOptional()
  target_audience?: TargetAudience;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
