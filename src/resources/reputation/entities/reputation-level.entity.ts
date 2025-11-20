import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { ReputationType } from './reputation-type.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('reputation_levels')
export class ReputationLevel extends AbstractBaseEntity {
  @ApiProperty({ description: 'The name of the level (e.g., Starter, Bronze)' })
  @Column()
  name: string;

  @ApiProperty({ enum: ReputationType, description: 'The type of user this level applies to' })
  @Column({ type: 'enum', enum: ReputationType })
  type: ReputationType;

  @ApiProperty({ description: 'Minimum points required' })
  @Column({ type: 'int' })
  minPoints: number;

  @ApiProperty({ description: 'Maximum points for this level (nullable for top tier)', required: false })
  @Column({ type: 'int', nullable: true })
  maxPoints: number | null;

  @ApiProperty({ description: 'Minimum actions required (campaigns created or joined)' })
  @Column({ type: 'int' })
  minCampaigns: number;

  @ApiProperty({ description: 'Maximum actions for this level (nullable for top tier)', required: false })
  @Column({ type: 'int', nullable: true })
  maxCampaigns: number | null;

  @ApiProperty({ description: 'List of privileges unlocked' })
  @Column({ type: 'jsonb', nullable: true })
  perks: string[];

  @ApiProperty({ description: 'Rank order of the level (1, 2, 3...)' })
  @Column({ type: 'int' })
  rank: number;
}
