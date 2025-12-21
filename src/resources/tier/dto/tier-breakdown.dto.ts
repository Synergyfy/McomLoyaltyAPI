import { ApiProperty } from "@nestjs/swagger";
import { Tier } from "../entities/tier.entity";

export class TierBreakdownDto extends Tier {
  @ApiProperty({
    description: "The number of businesses currently subscribed to this tier",
    example: 42,
  })
  businessCount: number;
}
