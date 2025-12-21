import { IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateParticipantBadgeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  minPoints: number;

  @ApiProperty()
  @IsInt()
  priority: number;

  @ApiProperty()
  @IsOptional()
  multiplier?: number;

  @ApiProperty()
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  maxPoints?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  privileges?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;
}
