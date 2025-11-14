import { IsNotEmpty, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { DiscountType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @IsNotEmpty()
  @IsNumber()
  discount_value: number;

  @IsNotEmpty()
  @IsDateString()
  expires_at: Date;
}
