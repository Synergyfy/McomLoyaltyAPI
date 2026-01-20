import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsArray, IsUUID } from "class-validator";
import { TargetAudience } from "../enums/target-audience.enum";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class CreateHelpCenterArticleDto {
  @ApiProperty({ example: "Getting Started with Mcom" })
  @IsString()
  title: string;

  @ApiProperty({ example: "General" })
  @IsString()
  category: string;

  @ApiProperty({ example: "Detailed content of the article..." })
  @IsString()
  content: string;

  @ApiProperty({ example: "A brief overview of how to get started." })
  @IsString()
  short_description: string;

  @ApiProperty({ enum: TargetAudience, example: TargetAudience.PARTICIPANT })
  @IsEnum(TargetAudience)
  target_audience: TargetAudience;

  @ApiPropertyOptional({ type: [String], description: "IDs of Targeted Tiers" })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  target_tier_ids?: string[];
}

export class UpdateHelpCenterArticleDto extends CreateHelpCenterArticleDto {}

export class FilterHelpCenterArticleDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TargetAudience })
  @IsEnum(TargetAudience)
  @IsOptional()
  target_audience?: TargetAudience;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;
}
