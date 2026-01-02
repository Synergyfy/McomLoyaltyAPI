import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RedeemRewardDto {
  @ApiProperty({
    description: "The ID of the staff member processing the redemption",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({
    description: "The ID of the participant redeeming the reward",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0852",
  })
  @IsString()
  @IsNotEmpty()
  participantId: string;

  @ApiProperty({
    description: "The ID of the reward being redeemed",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0854",
  })
  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @ApiProperty({
    description: "The ID of the campaign",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0855",
  })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({
    description: "The redemption code for the reward",
    example: "RED-12345",
  })
  @IsString()
  @IsNotEmpty()
  redemptionCode: string;

  @ApiProperty({
    description: "The method of redemption (points or stamps)",
    example: "points",
    enum: ["points", "stamps", "auto"],
    default: "auto",
    required: false,
  })
  @IsOptional()
  @IsString()
  redemptionMethod?: "points" | "stamps" | "auto" = "auto";
}
