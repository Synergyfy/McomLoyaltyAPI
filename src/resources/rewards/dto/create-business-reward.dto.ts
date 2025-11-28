import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { RewardStatus } from '../enums/reward-status.enum';

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
  @ApiProperty({
    description: 'The title of the reward',
    example: 'Free Coffee',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'The description of the reward',
    example: 'Get a free coffee with any purchase',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The image URL of the reward',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'The monetary value of the reward',
    example: 5.00,
  })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiProperty({
    description: 'The expiry date and time of the reward',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsOptional()
  expiry_datetime?: Date;

  @ApiProperty({
    description: 'The status of the reward',
    enum: RewardStatus,
    example: RewardStatus.ACTIVE,
  })
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;

  @ApiProperty({
    description: 'Whether the reward is disabled',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  disabled?: boolean;
}
