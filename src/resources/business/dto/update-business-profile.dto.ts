import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl } from "class-validator";
import { CreateBusinessDto } from "./create-business.dto";

export class UpdateBusinessProfileDto extends PartialType(CreateBusinessDto) {
  @ApiProperty({
    description: "The profile image URL of the business",
    required: false,
  })
  @IsOptional()
  @IsString()
  profile_image?: string;
}
