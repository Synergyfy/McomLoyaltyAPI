import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsArray, Min } from 'class-validator';

export class CreateBusinessLevelDto {
  @ApiProperty({ description: 'Name of the level' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Minimum points required', default: 0 })
  @IsInt()
  @Min(0)
  minPoints: number;

  @ApiProperty({ description: 'Maximum points for this level', required: false })
  @IsInt()
  @IsOptional()
  maxPoints?: number;

  @ApiProperty({ description: 'Minimum campaigns created required', default: 0 })
  @IsInt()
  @Min(0)
  minCampaigns: number;

  @ApiProperty({ description: 'Maximum campaigns for this level', required: false })
  @IsInt()
  @IsOptional()
  maxCampaigns?: number;

  @ApiProperty({ description: 'List of privileges', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  privileges?: string[];

  @ApiProperty({ description: 'Description of the level', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
