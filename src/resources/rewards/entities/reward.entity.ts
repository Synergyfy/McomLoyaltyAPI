import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { RewardType } from "../enums/reward-type.enum";
import { RewardAudience } from "../enums/reward-audience.enum";
import { RewardStatus } from "../enums/reward-status.enum";
import { Sector } from "../../sector/entities/sector.entity";
import { Tier } from "../../tier/entities/tier.entity";

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
}
