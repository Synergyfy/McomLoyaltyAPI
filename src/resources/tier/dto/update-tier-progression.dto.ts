import { IsOptional, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ProgressionLevelConfig } from "../interfaces/tier-config.interface";

export class UpdateTierProgressionDto {
  @ApiProperty({
    description: "Progression configuration for Pro level",
    required: false,
  })
  @IsOptional()
  @IsObject()
  pro?: ProgressionLevelConfig;

  @ApiProperty({
    description: "Progression configuration for Pro Plus level",
    required: false,
  })
  @IsOptional()
  @IsObject()
  pro_plus?: ProgressionLevelConfig;
}
