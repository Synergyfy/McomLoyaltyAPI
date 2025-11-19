import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractBaseEntity } from '@/database/entities/base.entity';
import { Business } from '@/resources/business/entities/business.entity';
import { Group } from './group.entity';
import { GroupMemberRole } from './enums/group-member-role.enum';
import { GroupMembershipStatus } from './enums/group-membership-status.enum';

@Entity('group_memberships')
export class GroupMembership extends AbstractBaseEntity {
  @ManyToOne(() => Group, (group) => group.memberships)
  group: Group;

  @ManyToOne(() => Business, (business) => business.groupMemberships)
  business: Business;

  @Column({ type: 'enum', enum: GroupMemberRole, default: GroupMemberRole.MEMBER })
  role: GroupMemberRole;

  @Column({ type: 'enum', enum: GroupMembershipStatus, default: GroupMembershipStatus.INVITED })
  status: GroupMembershipStatus;
}