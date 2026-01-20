import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "../entities/matching-point-redemption.entity";

export class ManualAdjustmentDto {
  @ApiProperty({ description: "ID of the user (Business or Participant)" })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: UserType, description: "Type of the user" })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  @ApiProperty({
    description: "Points to add (positive) or subtract (negative)",
  })
  @IsInt()
  @IsNotEmpty()
  points: number;

  @ApiProperty({ description: "Reason for the adjustment" })
  @IsString()
  @IsNotEmpty()
  description: string;
}
