import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PointLogDto {
  @ApiPropertyOptional({
    description: 'Optional campaign ID to filter the point logs.',
    example: 'b1a2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsOptional()
  campaignId?: string;
}
