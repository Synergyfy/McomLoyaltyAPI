import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { GroupCircleType } from "../enums/group-circle.enums";

export class CreateGroupCircleDto {
  @ApiProperty({ description: "Name of the group circle" })
  @IsString()
  name: string;

  @ApiProperty({ enum: GroupCircleType, description: "Type of the circle" })
  @IsEnum(GroupCircleType)
  type: GroupCircleType;

  @ApiProperty({
    description: "List of network contact IDs to add as initial members",
  })
  @IsArray()
  @IsString({ each: true })
  networkIds: string[];

  @ApiProperty({
    description:
      "List of referred business IDs to add as initial members (will be auto-added to network if missing)",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referredBusinessIds?: string[];

  @ApiProperty({
    description: "Duration of the circle in days (for Smart Money)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({
    description: "Contribution amount per round (for Smart Money)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  contributionAmount?: number;
}
