import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { RewardType } from '../enums/reward-type.enum';
import { RewardSource } from '../enums/reward-source.enum';
import { RewardAudience } from '../enums/reward-audience.enum';
import { RewardStatus } from '../enums/reward-status.enum';

export class CreateRewardDto {
  @ApiProperty({
    description: 'The title of the reward',
    example: 'Free Coffee',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The points required to redeem the reward',
    example: 1000,
  })
  @IsNumber()
  points_required: number;

  @ApiProperty({
    description: 'The monetary value of the reward',
    example: 5,
  })
  @IsNumber()
  value: number;

  @ApiProperty({
    description: 'A short description of the reward',
    example: 'A free coffee of your choice',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The URL of the reward image',
    example: 'https://example.com/coffee.jpg',
  })
  @IsString()
  image: string;

  @ApiProperty({
    description: 'The quantity of the reward available',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    enum: RewardType,
    description: 'The type of the reward',
    example: RewardType.VOUCHER,
  })
  @IsEnum(RewardType)
  reward_type: RewardType;

  @ApiProperty({
    enum: RewardSource,
    description: 'The source of the reward',
    example: RewardSource.MCOM_VAULT,
  })
  @IsEnum(RewardSource)
  reward_source: RewardSource;

  @ApiProperty({
    enum: RewardAudience,
    description: 'The target audience for the reward',
    example: RewardAudience.ALL_BUSINESS,
  })
  @IsEnum(RewardAudience)
  audience: RewardAudience;

  @ApiProperty({
    description: 'The expiry date and time of the reward',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  expiry_datetime?: Date;

  @ApiProperty({
    enum: RewardStatus,
    description: 'The status of the reward',
    example: RewardStatus.ACTIVE,
  })
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;

  @ApiProperty({
    description: 'The IDs of the sectors this reward is available to',
    example: ['a1b2c3d4-e5f6-7890-1234-567890abcdef'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  sector_ids?: string[];

  @ApiProperty({
    description: 'The IDs of the tiers this reward is available to',
    example: ['b2c3d4e5-f6g7-8901-2345-67890abcdefg'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  tier_ids?: string[];
}
