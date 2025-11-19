import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsOptional } from 'class-validator';
import { BaseCampaignDto } from './base-campaign.dto';

export class CreateCampaignDto extends BaseCampaignDto {
  @ApiProperty({
    description: 'The IDs of the business rewards attached to the campaign.',
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  business_reward_ids: string[];

  @ApiProperty({
    example: 'uuid-of-voucher',
    description: 'The ID of the voucher to associate with this campaign.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  voucherId?: string;
}
