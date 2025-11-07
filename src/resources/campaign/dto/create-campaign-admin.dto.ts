import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateCampaignDto } from './create-campaign.dto';

export class CreateCampaignAdminDto extends CreateCampaignDto {
  @ApiProperty({
    description: 'The ID of the business this campaign belongs to.',
  })
  @IsUUID()
  business_id: string;
}
