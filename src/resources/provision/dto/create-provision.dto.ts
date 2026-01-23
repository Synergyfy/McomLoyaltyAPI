import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ProvisionType } from "../entities/provision.entity";

export class CreateProvisionDto {
  @ApiProperty({ example: "ABC-123-XYZ" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ProvisionType })
  @IsEnum(ProvisionType)
  type: ProvisionType;

  @ApiProperty({ example: { tierId: "gold", durationDays: 45 } })
  @IsObject()
  @IsOptional()
  payload?: any;

  @ApiProperty()
  @IsDateString()
  expiresAt: string;
}
