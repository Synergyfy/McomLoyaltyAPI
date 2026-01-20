import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { RewardType } from "../enums/reward-type.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardStatus } from "../enums/reward-status.enum";

export enum SortBy {
  NEWEST = "newest",
  OLDEST = "oldest",
  POINTS_LOW = "points_low",
  POINTS_HIGH = "points_high",
}

export class GetRewardsFilterDto {
  @ApiPropertyOptional({
    description: "The page number for pagination",
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "The number of items per page",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Filter by whether stamps are enabled",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_stamps_enabled?: boolean;

  @ApiPropertyOptional({
    description: "Filter by whether points are enabled",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_points_enabled?: boolean;

  @ApiPropertyOptional({
    description: "Sort by newest or oldest",
    enum: SortBy,
    default: SortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.NEWEST;

  @ApiPropertyOptional({
    description: "Minimum points required",
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_points?: number;

  @ApiPropertyOptional({
    description: "Maximum points required",
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_points?: number;

  @ApiPropertyOptional({
    description: "Minimum stamps required",
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_stamps?: number;

  @ApiPropertyOptional({
    description: "Maximum stamps required",
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_stamps?: number;

  @ApiPropertyOptional({
    description: "Search in title and description",
    example: "Special",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by reward type",
    enum: RewardType,
  })
  @IsOptional()
  @IsEnum(RewardType)
  reward_type?: RewardType;

  @ApiPropertyOptional({
    description: "Filter by target audience",
    enum: RewardAudience,
  })
  @IsOptional()
  @IsEnum(RewardAudience)
  audience?: RewardAudience;

  @ApiPropertyOptional({
    description: "Filter by reward status",
    enum: RewardStatus,
  })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @ApiPropertyOptional({ description: "Filter by sector ID" })
  @IsOptional()
  @IsString()
  sectorId?: string;

  @ApiPropertyOptional({
    description: "Filter by reward type (camelCase variant)",
  })
  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @ApiPropertyOptional({
    description: "Include admin statistics (claim count, redemption stats)",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeStats?: boolean;
}
