import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class RedeemRewardSelfDto {
  @ApiProperty({
    description: "The ID of the reward being redeemed",
    example: "reward-uuid",
  })
  @IsNotEmpty()
  @IsUUID()
  rewardId: string;

  @ApiProperty({
    description: "The ID of the campaign",
    example: "campaign-uuid",
  })
  @IsNotEmpty()
  @IsUUID()
  campaignId: string;
}
