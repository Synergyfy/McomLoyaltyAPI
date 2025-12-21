import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsUUID } from "class-validator";
import { BaseCampaignDto } from "./base-campaign.dto";

export class CreateCampaignFromWishlistDto extends BaseCampaignDto {
  @ApiProperty({
    description:
      "The ID of the wishlist aggregate to create the campaign from.",
  })
  @IsUUID()
  wishlistAggregateId: string;

  @ApiProperty({
    description:
      "The IDs of the business rewards attached to the campaign (for Business).",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  business_reward_ids?: string[];

  @ApiProperty({
    description: "The IDs of the rewards attached to the campaign (for Admin).",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID("all", { each: true })
  reward_ids?: string[];
}
