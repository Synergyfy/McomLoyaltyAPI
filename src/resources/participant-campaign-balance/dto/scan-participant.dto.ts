import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  IsOptional,
  Length,
  IsEnum,
} from "class-validator";
import { TransactionType } from "../entities/transaction-code.entity";

export class ScanParticipantDto {
  @ApiProperty({
    description: "The 9-character unique code of the participant",
  })
  @IsString()
  @Length(9, 9)
  @IsNotEmpty()
  participantCode: string;

  @ApiProperty({ description: "The ID of the campaign" })
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;

  @IsOptional()
  points?: number;

  @ApiProperty({
    description: "The amount of stamps to award (required for STAMP_EARN)",
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  stamps?: number;

  @ApiProperty({
    description: "The ID of the reward (required for REDEEM)",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  rewardId?: string;

  @ApiProperty({
    description: "The type of transaction (EARN or REDEEM)",
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({
    description: "The method used for redemption if type is REDEEM",
    enum: ["points", "stamps", "auto"],
    default: "auto",
    required: false,
  })
  @IsOptional()
  @IsString()
  redemptionMethod?: "points" | "stamps" | "auto" = "auto";

  @ApiProperty({
    description: "Optional redemption code",
    required: false,
  })
  @IsOptional()
  @IsString()
  redemptionCode?: string;

  @ApiProperty({
    description:
      "Unique key to ensure idempotency (prevent duplicates on retry)",
    required: false,
    example: "uuid-v4-string",
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
