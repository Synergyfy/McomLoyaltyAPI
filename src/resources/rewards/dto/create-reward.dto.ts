import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { RewardType } from "../enums/reward-type.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardStatus } from "../enums/reward-status.enum";
import { ImageSourceType } from "../enums/image-source-type.enum";

export class CreateRewardDto {
  @ApiProperty({
    description: "The title of the reward",
    example: "Free Coffee",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "The maximum points allowed for this reward",
    example: 1000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  max_points?: number;

  @ApiProperty({
    description: "The maximum stamps required for this reward",
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  max_stamps_required?: number;

  @ApiProperty({
    description: "The monetary value of the reward",
    example: 5,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: "A short description of the reward",
    example: "A free coffee of your choice",
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: "The URL of the reward image",
    example: "https://example.com/coffee.jpg",
  })
  @IsString()
  image: string;

  @ApiProperty({
    description: "The gallery images of the reward",
    example: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gallery?: string[];

  @ApiProperty({
    description: "The quantity of the reward available",
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    enum: RewardType,
    description: "The type of the reward",
    example: RewardType.VOUCHER,
  })
  @IsEnum(RewardType)
  reward_type: RewardType;

  @ApiProperty({
    enum: RewardAudience,
    description: "The target audience for the reward",
    example: RewardAudience.ALL_BUSINESS,
  })
  @IsEnum(RewardAudience)
  audience: RewardAudience;

  @ApiProperty({
    description: "The expiry date and time of the reward",
    example: "2024-12-31T23:59:59.999Z",
  })
  @IsDateString()
  @IsOptional()
  expiry_datetime?: Date;

  @ApiProperty({
    enum: RewardStatus,
    description: "The status of the reward",
    example: RewardStatus.ACTIVE,
  })
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;

  @ApiProperty({
    description: "The IDs of the sectors this reward is available to",
    example: ["a1b2c3d4-e5f6-7890-1234-567890abcdef"],
    required: false,
  })
  @IsArray()
  @IsOptional()
  sector_ids?: string[];

  @ApiProperty({
    description: "The IDs of the tiers this reward is available to",
    example: ["b2c3d4e5-f6g7-8901-2345-67890abcdefg"],
    required: false,
  })
  @IsArray()
  @IsOptional()
  tier_ids?: string[];

  @ApiProperty({
    description: "Whether points are enabled for this reward",
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_points_enabled?: boolean;

  @ApiProperty({
    description: "Whether stamps are enabled for this reward",
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_stamps_enabled?: boolean;

  @ApiProperty({
    description: "The emoji to use for stamps",
    example: "☕",
    required: false,
  })
  @IsString()
  @IsOptional()
  stamp_emoji?: string;

  @ApiProperty({
    description: "The source type of the image",
    enum: ImageSourceType,
    example: ImageSourceType.CUSTOM_URL,
    required: false,
  })
  @IsEnum(ImageSourceType)
  @IsOptional()
  image_source_type?: ImageSourceType;

  @ApiProperty({
    description: "The ID of the library asset if source is LIBRARY_ASSET",
    example: "uuid",
    required: false,
  })
  @IsString()
  @IsOptional()
  library_asset_id?: string;

  @ApiProperty({
    description: "The ID of the sector if source is SECTOR_LOGO",
    example: "uuid",
    required: false,
  })
  @IsString()
  @IsOptional()
  sector_id?: string;

  @ApiProperty({
    description: "The ID of the category if source is CATEGORY_LOGO",
    example: "uuid",
    required: false,
  })
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiProperty({
    description: "The ID of the sub category if source is SUB_CATEGORY_LOGO",
    example: "uuid",
    required: false,
  })
  @IsString()
  @IsOptional()
  sub_category_id?: string;

  @ApiProperty({
    description: "The emoji character if source is EMOJI",
    example: "🎁",
    required: false,
  })
  @IsString()
  @IsOptional()
  emoji?: string;
}
