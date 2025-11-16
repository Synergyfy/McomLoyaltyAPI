import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateBusinessRewardDto {
  @ApiProperty({
    description: 'The quantity of the reward available for the business',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'The points required to redeem the reward',
    example: 1000,
  })
  @IsNumber()
  point_required: number;
}
