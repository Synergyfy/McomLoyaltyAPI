import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";

export class PageDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ example: 10 })
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: 2, nullable: true })
  next: number | null;

  @ApiProperty({ example: null, nullable: true })
  previous: number | null;
}
