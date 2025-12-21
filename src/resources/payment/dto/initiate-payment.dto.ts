import { IsNotEmpty, IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PlanType } from "../../membership/entities/membership.entity";

export class InitiatePaymentDto {
  @ApiProperty({
    description: "The ID of the membership tier to purchase.",
    example: "d0b3b3e0-0b3e-4b3e-8e3e-3e0b3b3e0b3e",
  })
  @IsNotEmpty()
  @IsString()
  tier_id: string;

  @ApiProperty({
    description:
      "The type of plan to purchase. Ignored if the tier is Seasonal (defaults to fixed price).",
    enum: PlanType,
    example: PlanType.MONTHLY,
  })
  @IsNotEmpty()
  @IsEnum(PlanType)
  plan_type: PlanType;

  @ApiProperty({
    description: "An optional coupon code to apply to the purchase.",
    example: "SUMMER2024",
    required: false,
  })
  @IsOptional()
  @IsString()
  coupon_code?: string;

  @ApiProperty({
    description: "Array of Point Package IDs to purchase as add-ons.",
    example: ["pkg_123", "pkg_456"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  point_package_ids?: string[];
}
