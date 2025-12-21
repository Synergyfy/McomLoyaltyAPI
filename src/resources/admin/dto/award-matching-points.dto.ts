import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class AwardMatchingPointsDto {
  @ApiProperty({
    type: String,
    description: "The participant's email",
    example: "johndoe@gmail.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: Number,
    description: "The matching points to award",
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  points: number;

  @ApiProperty({
    type: String,
    description: "The reason for awarding the points",
    example: "For winning the weekly challenge",
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
