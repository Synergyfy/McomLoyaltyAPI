import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    example: "test@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "123456",
  })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    example: "newPassword",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: "newPassword",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
