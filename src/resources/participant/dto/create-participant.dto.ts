import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateParticipantDto {
  @ApiProperty({
    description: "The name of the participant",
    example: "John Doe",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

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
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: "The password confirmation",
    example: "password123",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @ApiProperty({
    description: "The ID of the campaign to join",
    example: "clq0x0f5y0000t0z6c7j4a3b2",
    required: false,
  })
  @IsOptional()
  @IsString()
  campaignId?: string;
}
