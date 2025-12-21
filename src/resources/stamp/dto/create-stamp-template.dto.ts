import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from "class-validator";
import { StampTriggerMethod } from "../enums/stamp-trigger-method.enum";
import { StampRewardType } from "../enums/stamp-reward-type.enum";

export class CreateStampTemplateDto {
  @ApiProperty({ example: "Buy 5 Get 1 Free" })
  @IsString()
  title: string;

  @ApiProperty({ example: "Collect 5 stamps to get a free coffee." })
  @IsString()
  description: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  required_stamps: number;

  @ApiProperty({ enum: StampRewardType, example: StampRewardType.FREE_ITEM })
  @IsEnum(StampRewardType)
  reward_benefit: StampRewardType;

  @ApiProperty({ example: "Coffee", required: false })
  @IsOptional()
  @IsString()
  reward_benefit_value?: string;

  @ApiProperty({
    enum: StampTriggerMethod,
    example: StampTriggerMethod.QR_SCAN,
  })
  @IsEnum(StampTriggerMethod)
  trigger_method: StampTriggerMethod;

  @ApiProperty({
    example: 30,
    required: false,
    description: "Days valid after start",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  stamp_validity_days?: number;

  @ApiProperty({
    example: 7,
    required: false,
    description: "Days to redeem after completion",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  reward_claim_deadline_days?: number;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  is_hybrid?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  hybrid_points_per_stamp?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  hybrid_completion_bonus_points?: number;

  @ApiProperty({ example: "https://example.com/image.png", required: false })
  @IsOptional()
  @IsString()
  default_image?: string;
}
