import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsUUID } from "class-validator";
import { BaseCampaignDto } from "./base-campaign.dto";

export class CreateCampaignDto extends BaseCampaignDto {
  @ApiProperty({
    description: "The IDs of the business rewards attached to the campaign.",
    type: [String],
  })
  @IsArray()
  @IsUUID("all", { each: true })
  business_reward_ids: string[];
}
