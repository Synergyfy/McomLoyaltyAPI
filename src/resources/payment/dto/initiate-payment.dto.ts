import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { PlanType } from '../../membership/entities/membership.entity';

export class InitiatePaymentDto {
  @IsNotEmpty()
  @IsString()
  tier_id: string;

  @IsNotEmpty()
  @IsEnum(PlanType)
  plan_type: PlanType;

  @IsOptional()
  @IsString()
  coupon_code?: string;
}
