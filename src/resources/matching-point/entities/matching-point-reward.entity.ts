import { Entity, Column, ManyToOne, Index } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Admin } from "../../admin/entities/admin.entity";
import { ApiProperty } from "@nestjs/swagger";

export enum TargetAudience {
  BUSINESS_ONLY = "BUSINESS_ONLY",
  PARTICIPANT_ONLY = "PARTICIPANT_ONLY",
  BOTH = "BOTH",
}

@Entity("matching_point_reward")
export class MatchingPointReward extends AbstractBaseEntity {
  @ApiProperty()
  @Column()
  @Index()
  title: string;

  @ApiProperty()
  @Column()
  short_description: string;

  @ApiProperty()
  @Column("text")
  long_description: string;

  @ApiProperty()
  @Column()
  main_image: string;

  @ApiProperty()
  @Column("simple-array", { nullable: true })
  gallery_images: string[];

  @ApiProperty()
  @Column("int")
  @Index()
  required_points: number;

  @ApiProperty({ enum: TargetAudience })
  @Column({ type: "enum", enum: TargetAudience })
  @Index()
  target_audience: TargetAudience;

  @ApiProperty()
  @Column("int")
  quantity: number;

  @ApiProperty()
  @Column({ default: false })
  @Index()
  is_suspended: boolean;

  @ApiProperty()
  @Column({ type: "timestamp", nullable: true })
  @Index()
  start_datetime: Date;

  @ApiProperty()
  @Column({ type: "timestamp", nullable: true })
  @Index()
  end_datetime: Date;

  @ManyToOne(() => Business, { nullable: true })
  creatorBusiness: Business;

  @ManyToOne(() => Admin, { nullable: true })
  creatorAdmin: Admin;
}
