import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsString, IsOptional } from "class-validator";

export class ScanParticipantQrDto {
  @ApiProperty({ example: "participant-unique-code", required: false })
  @IsOptional()
  @IsString()
  participantUniqueCode?: string;

  @ApiProperty({ example: "participant-uuid", required: false })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({
    example: "business-stamp-reward-uuid",
    description: "The specific stamp reward program to add a stamp to",
  })
  @IsUUID()
  businessStampRewardId: string;
}
