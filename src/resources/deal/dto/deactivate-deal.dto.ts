import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class DeactivateDealDto {
  @ApiProperty({
    example: false,
    description: "The activation status of the deal",
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
