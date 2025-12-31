import { PartialType } from "@nestjs/swagger";
import { CreateCampaignDto } from "./create-campaign.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsUUID } from "class-validator";

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiProperty({
    description: "The IDs of the rewards attached to the campaign.",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  reward_ids?: string[];

  @ApiProperty({
    description: "The IDs of the business rewards attached to the campaign.",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  business_reward_ids?: string[];

  @ApiProperty({
    description: "The IDs of the target tiers for this campaign.",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  target_tier_ids?: string[];
}
