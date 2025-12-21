import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class PaginationDto {
  @ApiProperty({
    description: "The page number.",
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: "The number of items per page.",
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;
}
