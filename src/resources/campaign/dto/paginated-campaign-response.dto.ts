import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { Campaign } from "../entities/campaign.entity";
import { BusinessCampaign } from "../entities/business-campaign.entity";

export class PaginatedCampaignResponseDto {
  @ApiProperty({
    type: "array",
    items: {
      oneOf: [
        { $ref: getSchemaPath(Campaign) },
        { $ref: getSchemaPath(BusinessCampaign) },
      ],
    },
  })
  data: (Campaign | BusinessCampaign)[];

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
