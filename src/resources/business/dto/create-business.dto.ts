import { IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsPasswordMatching } from "../../../common/decorators/validation/is-password-matching.decorator";

export class CreateBusinessDto {
  @ApiProperty({
    description: "The first name of the business owner.",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "The last name of the business owner.",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "The contact email for the business.",
    example: "contact@gourmetkitchen.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The password for the business account.",
    example: "aStrongPassword123!",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "The password confirmation.",
    example: "aStrongPassword123!",
  })
  @IsString()
  @IsNotEmpty()
  @IsPasswordMatching("password", { message: "Passwords do not match" })
  confirmPassword: string;

  @ApiProperty({
    description:
      "The referral code of the business that referred this business.",
    example: "a1b2c3d4e",
    required: false,
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({
    description: "Code for pre-provisioned rewards (e.g. Free Tier Access).",
    example: "PROV-123-XYZ",
    required: false
  })
  @IsString()
  @IsOptional()
  provisionCode?: string;
}
