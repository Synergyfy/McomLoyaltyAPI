import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class IsJoinedDto {
  @ApiProperty({ description: "The ID of the campaign to check" })
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;
}
