import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class StartStampCardDto {
  @ApiProperty({
    example: "business-stamp-reward-uuid",
    description: "The specific stamp reward program to start",
  })
  @IsUUID()
  businessStampRewardId: string;
}
