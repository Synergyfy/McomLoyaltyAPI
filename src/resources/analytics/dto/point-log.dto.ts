import { ApiProperty } from "@nestjs/swagger";

export class PointLogItemDto {
  @ApiProperty({
    example: "John Doe",
    description: "The name of the participant.",
  })
  name: string;

  @ApiProperty({
    example: "john.doe@example.com",
    description: "The email of the participant.",
  })
  email: string;

  @ApiProperty({ example: 100, description: "The amount of points." })
  points: number;

  @ApiProperty({
    example: "EARN",
    description: "The description of the action (EARN or REDEEM).",
  })
  description: string;

  @ApiProperty({
    example: "Regular",
    description: "The type of point (Regular or Matching).",
  })
  type: string;

  @ApiProperty({
    example: "2023-10-27T10:00:00Z",
    description: "The date and time of the transaction.",
  })
  date: Date;
}

export class PointLogResponseDto {
  @ApiProperty({ type: [PointLogItemDto], description: "List of point logs." })
  data: PointLogItemDto[];

  @ApiProperty({ example: 100, description: "Total number of logs." })
  total: number;

  @ApiProperty({ example: 1, description: "Current page number." })
  page: number;

  @ApiProperty({ example: 10, description: "Number of items per page." })
  limit: number;
}
