import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsPasswordMatching } from "../../../common/decorators/validation/is-password-matching.decorator";

export class CreateStaffDto {
  @ApiProperty({
    description: "The first name of the staff member.",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "The last name of the staff member.",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "The email address of the staff member.",
    example: "john.doe@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "The password for the staff member account.",
    example: "staffPassword123",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "The password confirmation.",
    example: "staffPassword123",
  })
  @IsString()
  @IsNotEmpty()
  @IsPasswordMatching("password", { message: "Passwords do not match" })
  confirmPassword: string;

  @ApiProperty({
    description: "The URL of the avatar for the staff member.",
    required: false,
    example: "https://example.com/avatar.png",
  })
  @IsUrl()
  @IsOptional()
  avatar?: string;
}
