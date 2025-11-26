import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsArray, Min } from 'class-validator';

export class CreateCustomerBadgeDto {
  @ApiProperty({ description: 'Name of the badge' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Minimum points required', default: 0 })
  @IsInt()
  @Min(0)
  minPoints: number;

  @ApiProperty({ description: 'Maximum points for this badge', required: false })
  @IsInt()
  @IsOptional()
  maxPoints?: number;

  @ApiProperty({ description: 'Minimum campaigns joined required', default: 0 })
  @IsInt()
  @Min(0)
  minCampaignsJoined: number;

  @ApiProperty({ description: 'Maximum campaigns joined for this badge', required: false })
  @IsInt()
  @IsOptional()
  maxCampaignsJoined?: number;

  @ApiProperty({ description: 'List of privileges', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  privileges?: string[];

  @ApiProperty({ description: 'Description of the badge', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
