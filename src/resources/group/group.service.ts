import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMembership } from './entities/group-membership.entity';
import { BusinessService } from '../business/services/business.service';
import { NotificationService } from '../notification/notification.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InvitePartnerDto } from './dto/invite-partner.dto';
import { GroupMemberRole } from './entities/enums/group-member-role.enum';
import { GroupMembershipStatus } from './entities/enums/group-membership-status.enum';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMembership)
    private readonly groupMembershipRepository: Repository<GroupMembership>,
    private readonly businessService: BusinessService,
    private readonly notificationService: NotificationService,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    ownerId: string,
  ): Promise<Group> {
    const owner = await this.businessService.findById(ownerId);
    const group = this.groupRepository.create({
      ...createGroupDto,
      owner,
    });
    const savedGroup = await this.groupRepository.save(group);

    const membership = this.groupMembershipRepository.create({
      group: savedGroup,
      business: owner,
      role: GroupMemberRole.OWNER,
      status: GroupMembershipStatus.ACTIVE,
    });
    await this.groupMembershipRepository.save(membership);

    return savedGroup;
  }

  async invitePartner(
    groupId: string,
    invitePartnerDto: InvitePartnerDto,
    ownerId: string,
  ): Promise<GroupMembership> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, owner: { id: ownerId } },
    });

    if (!group) {
      throw new NotFoundException('Group not found or you are not the owner.');
    }

    const partner = await this.businessService.findByEmail(
      invitePartnerDto.partner_email,
    );

    if (!partner) {
      throw new NotFoundException('Partner business not found.');
    }

    // Check if the partner is already a member of the group.
    const existingMembership = await this.groupMembershipRepository.findOne({
      where: { group: { id: groupId }, business: { id: partner.id } },
    });

    if (existingMembership) {
      throw new UnauthorizedException('Partner is already a member of this group.');
    }

    const membership = this.groupMembershipRepository.create({
      group,
      business: partner,
      role: invitePartnerDto.role,
      status: GroupMembershipStatus.INVITED,
    });

    this.notificationService.send(
      partner.id,
      `You have been invited to join the group ${group.group_name}.`,
    );

    return this.groupMembershipRepository.save(membership);
  }

  async findById(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found.');
    }
    return group;
  }
}
