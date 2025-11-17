
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PlanType } from '../../membership/entities/membership.entity';

export class SubscribeDto {
  @ApiProperty({
    description: 'The ID of the tier to subscribe to.',
    example: 'clq0x0q0m0000c8f0b0a0a0a0',
  })
  @IsNotEmpty()
  @IsString()
  tier_id: string;

  @ApiProperty({
    description: 'The plan type to subscribe to.',
    example: PlanType.MONTHLY,
    enum: PlanType,
  })
  @IsNotEmpty()
  @IsEnum(PlanType)
  plan_type: PlanType;

  @ApiProperty({
    description: 'The payment token from the frontend.',
    example: 'tok_visa',
  })
  @IsNotEmpty()
  @IsString()
  payment_token: string;

  @ApiProperty({
    description: 'Whether this is a trial subscription.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_trial?: boolean;
}
