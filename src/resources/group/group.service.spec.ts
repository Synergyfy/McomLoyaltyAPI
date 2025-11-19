import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupService } from './group.service';
import { BusinessService } from '../business/services/business.service';
import { NotificationService } from '../notification/notification.service';
import { Group } from './entities/group.entity';
import { GroupMembership } from './entities/group-membership.entity';
import { Business } from '../business/entities/business.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { InvitePartnerDto } from './dto/invite-partner.dto';
import { GroupMemberRole } from './entities/enums/group-member-role.enum';
import { GroupMembershipStatus } from './entities/enums/group-membership-status.enum';

describe('GroupService', () => {
  let service: GroupService;
  let groupRepository: Repository<Group>;
  let groupMembershipRepository: Repository<GroupMembership>;
  let businessService: BusinessService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(Group),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupMembership),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: BusinessService,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    groupMembershipRepository = module.get<Repository<GroupMembership>>(
      getRepositoryToken(GroupMembership),
    );
    businessService = module.get<BusinessService>(BusinessService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGroup', () => {
    it('should create a group and add the owner as a member', async () => {
      const createGroupDto: CreateGroupDto = {
        group_name: 'Test Group',
        group_description: 'Test Description',
      };
      const ownerId = 'owner-id';
      const owner = new Business();
      owner.id = ownerId;

      (businessService.findById as jest.Mock).mockResolvedValue(owner);
      (groupRepository.create as jest.Mock).mockReturnValue({
        ...createGroupDto,
        owner,
      } as Group);
      (groupRepository.save as jest.Mock).mockResolvedValue({
        id: 'group-id',
        ...createGroupDto,
        owner,
      } as Group);
      (groupMembershipRepository.create as jest.Mock).mockReturnValue({
        group: { id: 'group-id' },
        business: owner,
        role: GroupMemberRole.OWNER,
        status: GroupMembershipStatus.ACTIVE,
      } as GroupMembership);
      (groupMembershipRepository.save as jest.Mock).mockResolvedValue({} as GroupMembership);

      const result = await service.createGroup(createGroupDto, ownerId);

      expect(result).toBeDefined();
      expect(result.group_name).toEqual(createGroupDto.group_name);
      expect(businessService.findById).toHaveBeenCalledWith(ownerId);
      expect(groupRepository.create).toHaveBeenCalledWith({
        ...createGroupDto,
        owner,
      });
      expect(groupRepository.save).toHaveBeenCalled();
      expect(groupMembershipRepository.create).toHaveBeenCalledWith({
        group: { id: 'group-id', ...createGroupDto, owner },
        business: owner,
        role: GroupMemberRole.OWNER,
        status: GroupMembershipStatus.ACTIVE,
      });
      expect(groupMembershipRepository.save).toHaveBeenCalled();
    });
  });

  describe('invitePartner', () => {
    it('should invite a partner to a group', async () => {
      const groupId = 'group-id';
      const ownerId = 'owner-id';
      const invitePartnerDto: InvitePartnerDto = {
        partner_email: 'partner@example.com',
        role: GroupMemberRole.MEMBER,
      };
      const group = new Group();
      group.id = groupId;
      const partner = new Business();
      partner.id = 'partner-id';

      (groupRepository.findOne as jest.Mock).mockResolvedValue(group);
      (businessService.findByEmail as jest.Mock).mockResolvedValue(partner);
      (groupMembershipRepository.findOne as jest.Mock).mockResolvedValue(null);
      (groupMembershipRepository.create as jest.Mock).mockReturnValue({
        group,
        business: partner,
        role: invitePartnerDto.role,
        status: GroupMembershipStatus.INVITED,
      } as GroupMembership);
      (notificationService.send as jest.Mock).mockResolvedValue(undefined);
      (groupMembershipRepository.save as jest.Mock).mockResolvedValue({} as GroupMembership);

      const result = await service.invitePartner(groupId, invitePartnerDto, ownerId);

      expect(result).toBeDefined();
      expect(groupRepository.findOne).toHaveBeenCalledWith({
        where: { id: groupId, owner: { id: ownerId } },
      });
      expect(businessService.findByEmail).toHaveBeenCalledWith(
        invitePartnerDto.partner_email,
      );
      expect(groupMembershipRepository.findOne).toHaveBeenCalledWith({
        where: { group: { id: groupId }, business: { id: partner.id } },
      });
      expect(notificationService.send).toHaveBeenCalledWith(
        'partner-id',
        `You have been invited to join the group ${group.group_name}.`,
      );
      expect(groupMembershipRepository.create).toHaveBeenCalledWith({
        group,
        business: partner,
        role: invitePartnerDto.role,
        status: GroupMembershipStatus.INVITED,
      });
      expect(groupMembershipRepository.save).toHaveBeenCalled();
    });
  });
});
