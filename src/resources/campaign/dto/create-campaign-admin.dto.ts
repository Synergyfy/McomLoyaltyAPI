import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { BaseCampaignDto } from './base-campaign.dto';

export class CreateCampaignAdminDto extends BaseCampaignDto {
  @ApiProperty({
    description: 'The ID of the business this campaign belongs to.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  business_id?: string;

  @ApiProperty({
    description: 'The IDs of the rewards attached to the campaign.',
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  reward_ids: string[];

  @ApiProperty({
    example: 'uuid-of-voucher',
    description: 'The ID of the voucher to associate with this campaign.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  voucherId?: string;
}
