import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Participant } from "../../participant/entities/participant.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";

@Entity("participant_campaign_balances")
export class ParticipantCampaignBalance extends AbstractBaseEntity {
  @ManyToOne(
    () => Participant,
    (participant) => participant.participantCampaignBalances,
  )
  participant: Participant;

  @ManyToOne(
    () => Campaign,
    (campaign) => campaign.participantCampaignBalances,
    { nullable: true },
  )
  campaign: Campaign;

  @ManyToOne(
    () => BusinessCampaign,
    (businessCampaign) => businessCampaign.participantCampaignBalances,
    { nullable: true },
  )
  @JoinColumn({ name: "business_campaign_id" })
  businessCampaign: BusinessCampaign;

  @Column({ default: 0 })
  campaign_balance: number;

  @Column({ default: 0 })
  stamp_balance: number;
}
