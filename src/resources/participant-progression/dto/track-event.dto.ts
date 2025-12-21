import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class TrackEventDto {
  @ApiProperty({
    description: "The key of the action to track (e.g. SHARE_LINK)",
  })
  @IsNotEmpty()
  @IsString()
  actionKey: string;

  @ApiProperty({ description: "Optional metadata for the event" })
  @IsOptional()
  meta?: any;
}
