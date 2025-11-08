import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';

@Entity('participant_campaign_balances')
export class ParticipantCampaignBalance extends AbstractBaseEntity {
  @ManyToOne(
    () => Participant,
    (participant) => participant.participantCampaignBalances,
  )
  participant: Participant;

  @ManyToOne(() => Campaign, (campaign) => campaign.participantCampaignBalances)
  campaign: Campaign;

  @Column({ default: 0 })
  campaign_balance: number;
}