import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

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
}
