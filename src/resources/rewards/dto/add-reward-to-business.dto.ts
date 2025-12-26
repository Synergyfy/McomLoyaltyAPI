import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

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
  })
  @IsNumber()
  @IsOptional()
  point_required?: number;

  @ApiProperty({
    description: "The stamps required to redeem the reward",
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  stamp_required?: number;

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
}
