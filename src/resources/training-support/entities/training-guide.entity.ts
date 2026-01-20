import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Tier } from "../../tier/entities/tier.entity";
import { TrainingVideo } from "./training-video.entity";
import { HelpCenterArticle } from "./help-center-article.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("training_guides")
export class TrainingGuide extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column("text")
  description: string;

  @ApiProperty({ type: () => Tier })
  @ManyToOne(() => Tier)
  @JoinColumn({ name: "target_tier_id" })
  targetTier: Tier;

  @Column({ name: "target_tier_id", nullable: true })
  target_tier_id: string;

  @ApiProperty({ type: () => TrainingVideo, isArray: true })
  @ManyToMany(() => TrainingVideo)
  @JoinTable({ name: "training_guide_videos" })
  videos: TrainingVideo[];

  @ApiProperty({ type: () => HelpCenterArticle, isArray: true })
  @ManyToMany(() => HelpCenterArticle)
  @JoinTable({ name: "training_guide_articles" })
  articles: HelpCenterArticle[];
}
