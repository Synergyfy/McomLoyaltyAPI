import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DiscountType } from "../entities/coupon.entity";

export class CreateCouponDto {
  @ApiProperty({
    description: "The unique code for the coupon.",
    example: "SUMMER2024",
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: "The type of discount.",
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @ApiProperty({
    description: "The value of the discount.",
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  discount_value: number;

  @ApiProperty({
    description: "The expiration date of the coupon.",
    example: "2024-12-31T23:59:59.000Z",
  })
  @IsNotEmpty()
  @IsDateString()
  expires_at: Date;
}
