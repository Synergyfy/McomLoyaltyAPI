import { Entity, Column, ManyToMany, JoinTable } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { TargetAudience } from "../enums/target-audience.enum";
import { Tier } from "../../tier/entities/tier.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("help_center_articles")
export class HelpCenterArticle extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column()
  category: string;

  @ApiProperty()
  @Column("text")
  content: string;

  @ApiProperty()
  @Column("text")
  short_description: string;

  @ApiProperty({ enum: TargetAudience })
  @Column({ type: "enum", enum: TargetAudience })
  target_audience: TargetAudience;

  @ApiProperty({ type: () => Tier, isArray: true })
  @ManyToMany(() => Tier)
  @JoinTable({ name: "help_center_article_tiers" })
  targetTiers: Tier[];
}
