import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsUUID } from "class-validator";

export class RedeemStampCardDto {
  @ApiProperty({ example: "participant-unique-code", required: false })
  @IsOptional()
  @IsString()
  participantUniqueCode?: string;

  @ApiProperty({ example: "stamp-card-uuid", required: false })
  @IsOptional()
  @IsUUID()
  stampCardId?: string;
}
