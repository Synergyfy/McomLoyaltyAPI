import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { DealStatus } from "../enums/deal-status.enum";

export class UpdateDealStatusDto {
  @ApiProperty({ enum: DealStatus, description: "The new status of the deal" })
  @IsEnum(DealStatus)
  @IsNotEmpty()
  status: DealStatus;
}
