import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SwapDrawDatesDto {
  @ApiProperty({ description: "First Member ID" })
  @IsUUID()
  memberId1: string;

  @ApiProperty({ description: "Second Member ID" })
  @IsUUID()
  memberId2: string;
}
