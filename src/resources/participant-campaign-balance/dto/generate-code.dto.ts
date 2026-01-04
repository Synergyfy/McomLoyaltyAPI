import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
  IsDateString,
  IsString,
} from "class-validator";
import { TransactionType } from "../entities/transaction-code.entity";

export class GenerateCodeDto {
  @ApiProperty({ description: "The ID of the campaign" })
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({
    description: "The type of transaction (EARN or REDEEM)",
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({
    description:
      "The amount of points to award (required for EARN, optional for REDEEM if linked to reward)",
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiProperty({
    description: "The ID of the reward (required for REDEEM)",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  rewardId?: string;

  @ApiProperty({ description: "Expiration date of the code" })
  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;

  @ApiProperty({
    description: "The method used for redemption if type is REDEEM",
    enum: ["points", "stamps", "auto"],
    default: "auto",
    required: false,
  })
  @IsOptional()
  @IsString()
  redemptionMethod?: "points" | "stamps" | "auto" = "auto";
}
