import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class RedeemDealDto {
  @ApiProperty({ description: "The redemption code (e.g. from QR scan)" })
  @IsString()
  @IsNotEmpty()
  redemptionCode: string;
}
