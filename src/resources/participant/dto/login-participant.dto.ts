import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginParticipantDto {
  @ApiProperty({
    description: "The email of the participant",
    example: "john.doe@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The password of the participant",
    example: "password123",
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: "The ID of the campaign to join",
    example: "clq0x0f5y0000t0z6c7j4a3b2",
    required: false,
  })
  @IsOptional()
  @IsString()
  campaignId?: string;
}
