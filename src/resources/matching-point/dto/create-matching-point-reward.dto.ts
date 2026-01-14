import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsArray,
  IsUrl,
  IsDateString,
} from "class-validator";
import { TargetAudience } from "../entities/matching-point-reward.entity";

export class CreateMatchingPointRewardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  short_description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  long_description: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  main_image: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  gallery_images?: string[];

  @ApiProperty()
  @IsInt()
  @Min(0)
  required_points: number;

  @ApiProperty({ enum: TargetAudience })
  @IsEnum(TargetAudience)
  target_audience: TargetAudience;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  start_datetime?: Date;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  end_datetime?: Date;
}
