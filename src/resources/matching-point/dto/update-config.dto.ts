import { IsBoolean, IsEnum, IsInt, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MatchingPointActivityType } from "../entities/matching-point-config.entity";

export class UpdateMatchingPointConfigDto {
  @ApiProperty({ enum: MatchingPointActivityType })
  @IsEnum(MatchingPointActivityType)
  activity_type: MatchingPointActivityType;

  @ApiProperty()
  @IsInt()
  points: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
