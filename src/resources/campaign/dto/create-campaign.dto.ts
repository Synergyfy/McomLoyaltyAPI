import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsUrl,
  IsArray,
  IsOptional,
  IsUUID,
  IsHexColor,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampaignType,
  AudienceType,
  RewardType,
} from '../entities/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({ description: 'The name of the campaign.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The type of the campaign.',
    enum: CampaignType,
    default: CampaignType.QR_CODE,
  })
  @IsEnum(CampaignType)
  campaign_type: CampaignType;

  @ApiProperty({ description: 'The message for the campaign.' })
  @IsString()
  @IsNotEmpty()
  campaign_message: string;

  @ApiProperty({ description: 'The start date of the campaign.' })
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty({ description: 'The end date of the campaign.' })
  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @ApiProperty({ description: 'The quantity of rewards available.' })
  @IsInt()
  quantity: number;

  @ApiProperty({
    description: 'The audience type for the campaign.',
    enum: AudienceType,
  })
  @IsEnum(AudienceType)
  audience_type: AudienceType;

  @ApiProperty({ description: 'The banner URL for the campaign.' })
  @IsUrl()
  banner_url: string;

  @ApiProperty({
    description: 'The logo URL for the campaign.',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiProperty({ description: 'The text on the CTA button.' })
  @IsString()
  @IsNotEmpty()
  cta_text: string;

  @ApiProperty({ description: 'The background color of the CTA button.' })
  @IsHexColor()
  cta_background_color: string;

  @ApiProperty({ description: 'The text color of the CTA button.' })
  @IsHexColor()
  cta_text_color: string;

  @ApiProperty({ description: 'The text color for the campaign.' })
  @IsHexColor()
  text_color: string;

  @ApiProperty({ description: 'The background color for the campaign.' })
  @IsHexColor()
  background_color: string;

  @ApiProperty({
    description: 'The IDs of the rewards attached to the campaign.',
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  reward_ids: string[];

  @ApiProperty({
    description: 'The type of reward for the campaign.',
    enum: RewardType,
    default: RewardType.REGULAR,
  })
  @IsEnum(RewardType)
  @IsOptional()
  reward_type: RewardType;

  @ApiProperty({
    description: 'The threshold for regular points.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  regular_points_threshold?: number;

  @ApiProperty({
    description: 'The threshold for matching points.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  matching_points_threshold?: number;
}