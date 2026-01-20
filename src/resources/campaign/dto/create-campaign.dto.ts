import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsUUID, IsDate, IsOptional, IsInt } from "class-validator";
import { Type } from "class-transformer";
import { BaseCampaignDto } from "./base-campaign.dto";

export class CreateCampaignDto extends BaseCampaignDto {
  @ApiProperty({ description: "The start date of the campaign." })
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty({ description: "The end date of the campaign." })
  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @ApiProperty({
    description: "The IDs of the business rewards attached to the campaign.",
    type: [String],
  })
  @IsArray()
  @IsUUID("all", { each: true })
  business_reward_ids: string[];

  @ApiProperty({
    description: "The total number of slots available for the campaign.",
    required: true,
  })
  @IsInt()
  total_slots: number;
}
