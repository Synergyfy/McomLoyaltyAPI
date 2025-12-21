import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { PaymentHistory } from "../entities/payment-history.entity";

export class PaginatedPaymentHistoryResponseDto {
  @ApiProperty({
    type: "array",
    items: {
      $ref: getSchemaPath(PaymentHistory),
    },
  })
  data: PaymentHistory[];

  @ApiProperty({ example: 100, description: "Total number of items" })
  total: number;

  @ApiProperty({ example: 1, description: "Current page number" })
  page: number;

  @ApiProperty({ example: 10, description: "Number of items per page" })
  limit: number;

  @ApiProperty({ example: 5, description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ example: 2, description: "Next page number", nullable: true })
  next: number | null;

  @ApiProperty({
    example: null,
    description: "Previous page number",
    nullable: true,
  })
  previous: number | null;
}
