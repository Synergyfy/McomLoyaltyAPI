import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ManualPromoteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  participantId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  badgeId: string;
}
