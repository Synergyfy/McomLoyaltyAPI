import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum HelpRequestType {
  CAMPAIGN_CREATION = 'CAMPAIGN_CREATION',
  CAMPAIGN_EDIT = 'CAMPAIGN_EDIT',
  CAMPAIGN_ARCHIVE = 'CAMPAIGN_ARCHIVE',
  REWARD_CREATION = 'REWARD_CREATION',
  REWARD_EDIT = 'REWARD_EDIT',
  REWARD_ARCHIVE = 'REWARD_ARCHIVE',
  TIER_MANAGEMENT = 'TIER_MANAGEMENT',
  ANALYTICS_REPORT = 'ANALYTICS_REPORT',
  GENERAL_SUPPORT = 'GENERAL_SUPPORT',
}

@Entity('help_requests')
export class HelpRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requesterId: string; // The User ID

  @Column({ type: 'enum', enum: HelpRequestType })
  type: HelpRequestType;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ default: 'PENDING' }) // Initial local status
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
