import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsPasswordMatching } from "../../../common/decorators/validation/is-password-matching.decorator";

export class CreateAdminDto {
  @ApiProperty({
    description: "The first name of the admin user.",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "The last name of the admin user.",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "The email address of the admin user.",
    example: "admin@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "The password for the admin account.",
    example: "strongPassword123!",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "The password confirmation.",
    example: "strongPassword123!",
  })
  @IsString()
  @IsNotEmpty()
  @IsPasswordMatching("password", { message: "Passwords do not match" })
  confirmPassword: string;
}
