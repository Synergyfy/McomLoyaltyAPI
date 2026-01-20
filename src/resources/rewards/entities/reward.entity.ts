import { Entity, Column, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { RewardType } from "../enums/reward-type.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardStatus } from "../enums/reward-status.enum";
import { Sector } from "../../sector/entities/sector.entity";
import { Tier } from "../../tier/entities/tier.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";
import { BusinessReward } from "./business-reward.entity";

import { RewardSource } from "../enums/reward-source.enum";

@Entity()
export class Reward extends AbstractBaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  max_points: number;

  @Column({ nullable: true })
  max_stamps_required: number;

  @Column({ type: "enum", enum: RewardType })
  reward_type: RewardType;

  @Column({
    type: "enum",
    enum: RewardSource,
    default: RewardSource.MCOM_VAULT,
  })
  reward_source: RewardSource;

  @Column({ type: "enum", enum: RewardAudience })
  audience: RewardAudience;

  @Column({ type: "timestamp", nullable: true })
  expiry_datetime: Date;

  @Column({
    type: "enum",
    enum: RewardStatus,
    default: RewardStatus.ACTIVE,
  })
  status: RewardStatus;

  @ManyToMany(() => Sector)
  @JoinTable({
    name: "reward_sectors_sector",
    joinColumn: {
      name: "rewardId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "sectorId",
      referencedColumnName: "id",
    },
  })
  sectors: Sector[];

  @ManyToMany(() => Tier)
  @JoinTable({
    name: "reward_tiers_tier",
    joinColumn: {
      name: "rewardId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "tierId",
      referencedColumnName: "id",
    },
  })
  tiers: Tier[];

  @OneToMany(() => PointHistory, (pointHistory) => pointHistory.reward)
  pointHistories: PointHistory[];

  @OneToMany(() => BusinessReward, (businessReward) => businessReward.reward)
  businessRewards: BusinessReward[];

  @Column()
  value: number;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column("text", { array: true, nullable: true })
  gallery: string[];

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: true })
  is_points_enabled: boolean;

  @Column({ default: false })
  is_stamps_enabled: boolean;

  @Column({ nullable: true })
  stamp_emoji: string;

  @Column({ default: false })
  disabled: boolean;

  business_claimed_count?: number;
  total_redemptions_count?: number;
  total_points_redeemed?: number;
  total_stamps_redeemed?: number;
}
