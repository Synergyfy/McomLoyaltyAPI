import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CreateTierDto } from './create-tier.dto';
import { TierStatus } from '../entities/tier-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTierDto extends PartialType(CreateTierDto) {
  @ApiProperty({
    description: 'The quarterly price of the tier.',
    example: 135,
  })
  @IsOptional()
  @IsNumber()
  quaterly_price?: number;

  @ApiProperty({
    description: 'The status of the tier.',
    example: TierStatus.PUBLISHED,
    enum: TierStatus,
  })
  @IsOptional()
  @IsEnum(TierStatus)
  status?: TierStatus;
}
