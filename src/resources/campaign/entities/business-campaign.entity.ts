import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Campaign } from './campaign.entity';

@Entity('business_campaigns')
export class BusinessCampaign extends AbstractBaseEntity {
  @ManyToOne(() => Business, (business) => business.businessCampaigns)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Campaign, (campaign) => campaign.businessCampaigns)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ length: 9, unique: true })
  uniqueCode: string;
}
