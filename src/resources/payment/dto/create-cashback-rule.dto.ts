import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum Platform {
  MCOM_LOYALTY = "MCOM_LOYALTY",
  MCOM_MALL = "MCOM_MALL",
}

export enum RewardType {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
}

export class CreateCashbackRuleDto {
  @ApiProperty({
    enum: Platform,
    description: "The platform this rule applies to",
  })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({
    description: "The event type string (e.g., MEMBERSHIP_PURCHASE)",
  })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    enum: RewardType,
    description: "Type of reward: FIXED or PERCENTAGE",
  })
  @IsEnum(RewardType)
  rewardType: RewardType;

  @ApiProperty({
    description: "Value of the reward (amount or percentage)",
    example: 10,
  })
  @IsNumber()
  rewardValue: number;

  @ApiProperty({
    required: false,
    default: true,
    description: "Whether the rule is active",
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CashbackRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty()
  eventType: string;

  @ApiProperty({ enum: RewardType })
  rewardType: RewardType;

  @ApiProperty()
  rewardValue: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

import { PartialType } from "@nestjs/swagger";

export class UpdateCashbackRuleDto extends PartialType(CreateCashbackRuleDto) {}
