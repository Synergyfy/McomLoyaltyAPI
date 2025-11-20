import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { ReputationLevel } from './reputation-level.entity';
import { ReputationType } from './reputation-type.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('reputation_logs')
export class ReputationLog extends AbstractBaseEntity {
  @ApiProperty({ description: 'The ID of the user (Business or Participant)' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: ReputationType, description: 'The type of user' })
  @Column({ type: 'enum', enum: ReputationType })
  userType: ReputationType;

  @ApiProperty({ type: () => ReputationLevel, description: 'The previous level' })
  @ManyToOne(() => ReputationLevel, { nullable: true })
  oldLevel: ReputationLevel;

  @ApiProperty({ type: () => ReputationLevel, description: 'The new level' })
  @ManyToOne(() => ReputationLevel)
  newLevel: ReputationLevel;

  @ApiProperty({ description: 'Reason for the change' })
  @Column()
  reason: string;
}
