import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  GroupCircleType,
  GroupCircleDuration,
  InteractionLevel,
} from "../enums/group-circle.enums";

export class CreateGroupCircleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: GroupCircleType })
  @IsEnum(GroupCircleType)
  type: GroupCircleType;

  @ApiProperty({ enum: GroupCircleDuration })
  @IsEnum(GroupCircleDuration)
  duration: GroupCircleDuration;

  @ApiProperty({ enum: InteractionLevel })
  @IsEnum(InteractionLevel)
  interactionLevel: InteractionLevel;

  @ApiProperty({ description: "List of Network IDs to add to the circle" })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty()
  networkIds: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  contributionAmount?: number;
}
