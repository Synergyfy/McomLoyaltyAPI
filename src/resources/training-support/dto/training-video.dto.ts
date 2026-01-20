import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsArray,
  IsUUID,
} from "class-validator";
import { TargetAudience } from "../enums/target-audience.enum";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class CreateTrainingVideoDto {
  @ApiProperty({ example: "How to setup your business profile" })
  @IsString()
  title: string;

  @ApiProperty({ enum: TargetAudience, example: TargetAudience.BUSINESS })
  @IsEnum(TargetAudience)
  target_audience: TargetAudience;

  @ApiProperty({
    example: "This video will guide you through the initial setup process.",
  })
  @IsString()
  description: string;

  @ApiProperty({ example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
  @IsUrl()
  video_url: string;

  @ApiPropertyOptional({ example: "https://example.com/image.png" })
  @IsUrl()
  @IsOptional()
  cover_image?: string;

  @ApiPropertyOptional({ type: [String], description: "IDs of Targeted Tiers" })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  target_tier_ids?: string[];
}

export class UpdateTrainingVideoDto extends CreateTrainingVideoDto {}

export class FilterTrainingVideoDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TargetAudience })
  @IsEnum(TargetAudience)
  @IsOptional()
  target_audience?: TargetAudience;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;
}
