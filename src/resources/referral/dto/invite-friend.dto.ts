import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class InviteFriendDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    required: false,
    description: "Campaign ID if inviting to a specific campaign",
  })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
