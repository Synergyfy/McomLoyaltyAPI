import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsArray,
} from "class-validator";
import { RewardStatus } from "../enums/reward-status.enum";
import { RewardType } from "../enums/reward-type.enum";
import { ImageSourceType } from "../enums/image-source-type.enum";
import { RewardSource } from "../enums/reward-source.enum";
import { RewardAudience } from "../enums/reward-audience.enum";

export class CreateBusinessRewardDto {
  @ApiProperty({
    description: "The quantity of the reward available for the business",
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: "The points required to redeem the reward",
    example: 1000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  points_required?: number;

  @ApiProperty({
    description: "The stamps required to redeem the reward",
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  stamps_required?: number;
  @ApiProperty({
    description: "The title of the reward",
    example: "Free Coffee",
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: "The description of the reward",
    example: "Get a free coffee with any purchase",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "The image URL of the reward",
    example: "https://example.com/image.jpg",
  })
  @IsString()
  @IsOptional()
  image?: string;

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
    description: "The expiry date and time of the reward",
    example: "2024-12-31T23:59:59.000Z",
  })
  @IsDateString()
  @IsOptional()
  expiry_datetime?: Date;

  @ApiProperty({
    description: "The status of the reward",
    enum: RewardStatus,
    example: RewardStatus.ACTIVE,
  })
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;

  @ApiProperty({
    description: "The type of the reward",
    enum: RewardType,
    example: RewardType.VOUCHER,
  })
  @IsEnum(RewardType)
  reward_type: RewardType;

  @ApiProperty({
    description: "Whether the reward is disabled",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  disabled?: boolean;

  @ApiProperty({
    description: "Whether the reward is integrated with the Mall",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_mall_integrated?: boolean;

  @ApiProperty({
    description: "The value of the mall reward",
    example: 10.0,
  })
  @IsNumber()
  @IsOptional()
  mall_reward_value?: number;

  @ApiProperty({
    description: "The type of the mall reward",
    enum: ["VOUCHER", "GIFT_CARD", "COUPON"],
    example: "VOUCHER",
  })
  @IsString()
  @IsOptional()
  mall_reward_type?: "VOUCHER" | "GIFT_CARD" | "COUPON";

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

  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiProperty({ enum: RewardSource, required: false })
  @IsEnum(RewardSource)
  @IsOptional()
  reward_source?: RewardSource;

  @ApiProperty({ enum: RewardAudience, required: false })
  @IsEnum(RewardAudience)
  @IsOptional()
  audience?: RewardAudience;
}
