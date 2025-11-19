import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { GroupMembership } from './group-membership.entity';
import { Plaque } from '../../plaque/entities/plaque.entity';

@Entity('groups')
export class Group extends AbstractBaseEntity {
  @Column()
  group_name: string;

  @Column({ nullable: true })
  group_description: string;

  @ManyToOne(() => Business, (business) => business.ownedGroups)
  owner: Business;

  @OneToMany(() => GroupMembership, (membership) => membership.group)
  memberships: GroupMembership[];

  @OneToMany(() => Plaque, (plaque) => plaque.group)
  plaques: Plaque[];

  @Column({ type: 'jsonb', nullable: true })
  commission_rules: Record<string, any>;

  @Column({ default: 'private' })
  visibility: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}