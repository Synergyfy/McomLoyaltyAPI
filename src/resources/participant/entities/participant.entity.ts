import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { BusinessCampaign } from '../../campaign/entities/business-campaign.entity';
import { Role } from '../../../common/role.enum';
import { PointHistory } from '../../participant-campaign-balance/entities/point-history.entity';
import { ParticipantCampaignBalance } from '../../participant-campaign-balance/entities/participant-campaign-balance.entity';
import { DealRedemption } from '../../deal/entities/deal-redemption.entity';
import { DealReview } from '../../deal/entities/deal-review.entity';

@Entity('participants')
export class Participant extends AbstractBaseEntity {
    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password?: string;

    @Column({ type: 'enum', enum: Role, default: Role.Participant })
    role: Role;

    @Column({ unique: true })
    uniqueCode: string;

    @ManyToMany(() => Campaign, (campaign) => campaign.participants)
    @JoinTable()
    campaigns: Campaign[];

    @ManyToMany(() => BusinessCampaign, (businessCampaign) => businessCampaign.participants)
    @JoinTable()
    businessCampaigns: BusinessCampaign[];

    @OneToMany(
        () => ParticipantCampaignBalance,
        (participantCampaignBalance) => participantCampaignBalance.participant,
    )
    participantCampaignBalances: ParticipantCampaignBalance[];

    @OneToMany(() => PointHistory, (pointHistory) => pointHistory.participant)
    pointHistories: PointHistory[];

    @OneToMany(() => DealRedemption, (redemption) => redemption.user)
    dealRedemptions: DealRedemption[];

    @OneToMany(() => DealReview, (review) => review.user)
    dealReviews: DealReview[];

    @Column({ default: 0 })
    global_total_points: number;

    @Column({ default: 0 })
    matching_points: number;

    @Column({ default: false })
    isDisabled: boolean;
}