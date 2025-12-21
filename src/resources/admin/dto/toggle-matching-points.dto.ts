import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ToggleMatchingPointsDto {
  @ApiProperty({
    type: String,
    description: "The ID of the campaign to toggle matching points for",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  })
  @IsUUID()
  campaignId: string;
}
