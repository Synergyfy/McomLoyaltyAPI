import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Campaign } from './campaign.entity';

@Entity('business_campaigns')
export class BusinessCampaign extends AbstractBaseEntity {
  @ManyToOne(() => Business, (business) => business.addedCampaigns)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Campaign, (campaign) => campaign.addedByBusinesses)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}