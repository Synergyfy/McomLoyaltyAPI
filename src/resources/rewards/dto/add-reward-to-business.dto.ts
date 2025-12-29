import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsBoolean } from "class-validator";

export class AddRewardToBusinessDto {
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
  })
  @IsBoolean()
  @IsOptional()
  is_points_enabled?: boolean;

  @ApiProperty({
    description: "Whether stamps are enabled for this reward",
    example: false,
    required: false,
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
}
