import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsUUID,
  IsDate,
  IsOptional,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";

export class ClaimCampaignDto {
  @ApiProperty({ description: "The start date of the campaign." })
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty({ description: "The end date of the campaign." })
  @Type(() => Date)
  @IsDate()
  end_date: Date;

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

  @ApiProperty({
    description: "The total number of slots available for the campaign.",
    required: true,
  })
  @IsInt()
  total_slots: number;
}
