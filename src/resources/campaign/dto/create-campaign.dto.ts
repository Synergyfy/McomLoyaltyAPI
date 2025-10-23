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
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty({ description: 'The name of the campaign.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'A long description of the campaign.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'The start date of the campaign.' })
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty({ description: 'The end date of the campaign.' })
  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @ApiProperty({ description: 'The main image URL for the campaign.' })
  @IsUrl()
  main_image: string;

  @ApiProperty({
    description: 'A gallery of image URLs for the campaign.',
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  gallery: string[];

  @ApiProperty({
    description: 'The IDs of the rewards attached to the campaign.',
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  reward_ids: string[];

  @ApiProperty({
    description: 'The ID of the business this campaign belongs to.',
  })
  @IsUUID()
  business_id: string;

  @ApiProperty({ description: 'The text color for the campaign.' })
  @IsHexColor()
  text_color: string;

  @ApiProperty({ description: 'The background color for the campaign.' })
  @IsHexColor()
  background_color: string;
}