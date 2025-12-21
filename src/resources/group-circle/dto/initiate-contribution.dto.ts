import { IsUUID, IsNumber, IsEnum, IsOptional, IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PaymentProvider } from "../enums/group-circle.enums";

export class InitiateContributionDto {
  @ApiProperty()
  @IsUUID()
  memberId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  round?: number;
}
