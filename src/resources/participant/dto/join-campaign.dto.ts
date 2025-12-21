import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class JoinCampaignDto {
  @ApiProperty({
    description: "The ID of the campaign to join",
    example: "clq0x0f5y0000t0z6c7j4a3b2",
  })
  @IsNotEmpty()
  @IsString()
  campaignId: string;
}
