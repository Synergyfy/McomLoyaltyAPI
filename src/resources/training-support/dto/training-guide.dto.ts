import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsUUID } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class CreateTrainingGuideDto {
  @ApiProperty({ example: "Business Mastery Guide" })
  @IsString()
  title: string;

  @ApiProperty({
    example: "A comprehensive guide for businesses to master loyalty.",
  })
  @IsString()
  description: string;

  @ApiProperty({ example: "tier-uuid" })
  @IsUUID()
  target_tier_id: string;

  @ApiPropertyOptional({
    type: [String],
    description: "IDs of Training Videos",
  })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  video_ids?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: "IDs of Help Center Articles",
  })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  article_ids?: string[];
}

export class UpdateTrainingGuideDto extends CreateTrainingGuideDto {}

export class FilterTrainingGuideDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  target_tier_id?: string;
}
