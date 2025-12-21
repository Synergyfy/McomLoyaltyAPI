import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class ClaimCampaignDto {
  @ApiProperty({
    description:
      "List of Business Reward IDs to be associated with the campaign",
    type: [String],
    example: ["uuid1", "uuid2"],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  business_reward_ids: string[];
}
