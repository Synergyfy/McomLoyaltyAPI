import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
