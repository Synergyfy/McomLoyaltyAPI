import { IsNotEmpty, IsString, IsEnum, IsDate } from "class-validator";
import { PlanType } from "../entities/membership.entity";

export class CreateMembershipDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  user_type: string;

  @IsNotEmpty()
  @IsString()
  tier_id: string;

  @IsNotEmpty()
  @IsEnum(PlanType)
  plan_type: PlanType;

  @IsNotEmpty()
  @IsDate()
  starts_at: Date;

  @IsNotEmpty()
  @IsDate()
  expires_at: Date;
}
