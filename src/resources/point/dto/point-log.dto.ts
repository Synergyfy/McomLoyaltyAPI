import { IsOptional, IsString } from 'class-validator';

export class PointLogDto {
  @IsString()
  @IsOptional()
  campaignId?: string;
}
