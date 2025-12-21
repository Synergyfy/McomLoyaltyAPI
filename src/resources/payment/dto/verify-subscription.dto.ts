import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifySubscriptionDto {
  @ApiProperty({
    description: "The PayPal Subscription ID",
    example: "I-BW452GLLEP1G",
  })
  @IsNotEmpty()
  @IsString()
  subscription_id: string;
}
