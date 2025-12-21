import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSystemSettingDto {
  @ApiProperty({
    description: "The unique key for the setting",
    example: "POINT_PRICE_GBP",
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: "The value of the setting", example: "0.10" })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: "Optional description of what this setting controls",
    example: "Price per point in GBP",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
