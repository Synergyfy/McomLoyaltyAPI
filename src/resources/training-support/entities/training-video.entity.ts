import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { TargetAudience } from "../enums/target-audience.enum";
import { Tier } from "../../tier/entities/tier.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("training_videos")
export class TrainingVideo extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty({ enum: TargetAudience })
  @Column({ type: "enum", enum: TargetAudience })
  target_audience: TargetAudience;

  @ApiProperty()
  @Column("text")
  description: string;

  @ApiProperty()
  @Column()
  video_url: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  cover_image: string;

  @ApiProperty({ type: () => Tier, isArray: true })
  @ManyToMany(() => Tier)
  @JoinTable({ name: "training_video_tiers" })
  targetTiers: Tier[];
}
