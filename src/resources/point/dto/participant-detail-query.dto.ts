import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ParticipantDetailQueryDto {
  @ApiPropertyOptional({
    description: 'Optional campaign ID to filter the participant\'s balance and history.',
    example: 'b1a2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  campaignId?: string;
}
