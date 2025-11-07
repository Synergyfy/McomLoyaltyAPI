import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantQueryDto {
  @ApiPropertyOptional({
    description: 'Optional campaign ID to filter participants.',
    example: 'b1a2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'The page number for pagination.',
    default: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'The number of items per page.',
    default: 10,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
