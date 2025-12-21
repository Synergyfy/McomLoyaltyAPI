import {
  IsUUID,
  IsNumber,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ContributionStatus } from "../entities/group-circle-contribution.entity";
import { PaymentProvider } from "../enums/group-circle.enums";

export class RecordContributionDto {
  @ApiProperty()
  @IsUUID()
  memberId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsInt()
  round: number;

  @ApiProperty({ enum: ContributionStatus, required: false })
  @IsEnum(ContributionStatus)
  @IsOptional()
  status?: ContributionStatus;

  @ApiProperty({ enum: PaymentProvider, required: false })
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  transactionId?: string;
}
