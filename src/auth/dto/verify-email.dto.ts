import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({
    description: "The email address to verify",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "The OTP code sent to the email",
    example: "123456",
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
