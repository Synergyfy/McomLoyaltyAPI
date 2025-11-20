import { ApiProperty } from '@nestjs/swagger';
import { Campaign } from '../entities/campaign.entity';

export class PaginatedCampaignResponseDto {
  @ApiProperty({ type: () => [Campaign] })
  data: Campaign[];

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
}
