import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupCircle } from './entities/group-circle.entity';
import { GroupCircleMember } from './entities/group-circle-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupActivity } from './entities/group-activity.entity';
import { CreateGroupCircleDto } from './dto/create-group-circle.dto';
import { UpdateGroupCircleDto } from './dto/update-group-circle.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AssignBankerDto } from './dto/assign-banker.dto';
import { SwapDrawDatesDto } from './dto/swap-draw-dates.dto';
import { NetworkList } from '../network/entities/network-list.entity';
import { Network } from '../network/entities/network.entity';
import { Business } from '../business/entities/business.entity';
import { GroupCircleType, GroupCircleRole } from './enums/group-circle.enums';
import { Membership, MembershipStatus } from '../membership/entities/membership.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class GroupCircleService {
    constructor(
        @InjectRepository(GroupCircle) private circleRepo: Repository<GroupCircle>,
        @InjectRepository(GroupCircleMember) private memberRepo: Repository<GroupCircleMember>,
        @InjectRepository(GroupMessage) private messageRepo: Repository<GroupMessage>,
        @InjectRepository(GroupActivity) private activityRepo: Repository<GroupActivity>,
        @InjectRepository(NetworkList) private listRepo: Repository<NetworkList>,
        @InjectRepository(Network) private networkRepo: Repository<Network>,
    ) { }

    async create(createDto: CreateGroupCircleDto, business: Business) {
        const lists = await this.listRepo.find({
            where: { id: In(createDto.networkListIds), business: { id: business.id } },
            relations: ['networks']
        });

        if (lists.length !== createDto.networkListIds.length) {
            throw new NotFoundException('Some network lists were not found');
        }

        if (createDto.type === GroupCircleType.SMART_MONEY) {
            await this.validateSmartMoneyRules(createDto, business);
        }

        const allNetworks = new Map<string, Network>();
        lists.forEach(list => {
            list.networks.forEach(net => {
                if (!createDto.initialMemberIds || createDto.initialMemberIds.includes(net.id)) {
                    allNetworks.set(net.id, net);
                }
            });
        });

        if (createDto.type === GroupCircleType.SMART_MONEY) {
            if (allNetworks.size < 6 || allNetworks.size > 12) {
                 throw new BadRequestException('Smart Money Circles must have between 6 and 12 members.');
            }
        }

        const circle = this.circleRepo.create({
            ...createDto,
            business,
            sourceLists: lists,
            startDate: new Date(),
            payoutFrequency: createDto.type === GroupCircleType.SMART_MONEY ? 'WEEKLY' : undefined
        });

        const savedCircle = await this.circleRepo.save(circle);

        const members = Array.from(allNetworks.values()).map((net, index) => {
            const member = this.memberRepo.create({
                groupCircle: savedCircle,
                network: net,
                role: GroupCircleRole.PERIPHERAL
            });

            if (createDto.type === GroupCircleType.SMART_MONEY) {
                const drawDate = new Date(savedCircle.startDate);
                drawDate.setDate(drawDate.getDate() + (index * 7));
                member.drawDate = drawDate;
            }
            return member;
        });

        await this.memberRepo.save(members);
        await this.logActivity(savedCircle, 'CREATED', { by: business.id });

        return this.findOne(savedCircle.id, business.id);
    }

    async validateSmartMoneyRules(dto: CreateGroupCircleDto, business: Business) {
        const membership = await this.circleRepo.manager.findOne(Membership, {
             where: { business: { id: business.id }, status: MembershipStatus.ACTIVE },
             relations: ['tier']
        });

        if (!membership) {
            throw new BadRequestException('Active membership required for Smart Money Circle');
        }

        const tierName = membership.tier.name.toUpperCase();
        // Assuming tier names contain BRONZE, SILVER, GOLD, PLATINUM
        let limit = null;
        if (tierName.includes('BRONZE')) limit = { duration: 90, amount: 25 };
        else if (tierName.includes('SILVER')) limit = { duration: 180, amount: 50 };
        else if (tierName.includes('GOLD')) limit = { duration: 270, amount: 75 };
        else if (tierName.includes('PLATINUM')) limit = { duration: 360, amount: 100 };

        if (!limit) {
             // If custom tier, we might allow or block. Blocking for safety as per requirements.
             throw new BadRequestException('Invalid membership tier for Smart Money');
        }

        if (dto.duration > limit.duration) {
             throw new BadRequestException(`Duration ${dto.duration} exceeds limit for ${tierName} tier (${limit.duration})`);
        }

        if (dto.contributionAmount && dto.contributionAmount > limit.amount) {
             throw new BadRequestException(`Contribution ${dto.contributionAmount} exceeds limit for ${tierName} tier (£${limit.amount})`);
        }
    }

    async findAll(query: PaginationDto, businessId: string) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const [data, total] = await this.circleRepo.findAndCount({
            where: { business: { id: businessId } },
            take: limit,
            skip,
            order: { created_at: 'DESC' },
            relations: ['members', 'members.network']
        });

        return {
            data,
            meta: { total, page, limit }
        };
    }

    async findOne(id: string, businessId: string) {
        const circle = await this.circleRepo.findOne({
            where: { id, business: { id: businessId } },
            relations: ['members', 'members.network', 'sourceLists']
        });
        if (!circle) throw new NotFoundException('Group Circle not found');
        return circle;
    }

    async update(id: string, dto: UpdateGroupCircleDto, businessId: string) {
        const circle = await this.findOne(id, businessId);
        const { networkListIds, ...data } = dto;

        Object.assign(circle, data);

        if (networkListIds) {
            const lists = await this.listRepo.find({
                where: { id: In(networkListIds), business: { id: businessId } }
            });
            circle.sourceLists = lists;
        }

        return await this.circleRepo.save(circle);
    }

    async assignBanker(id: string, dto: AssignBankerDto, businessId: string) {
        await this.findOne(id, businessId); // Check access

        // Unset previous banker
        await this.memberRepo.update({ groupCircle: { id }, role: GroupCircleRole.BANKER }, { role: GroupCircleRole.PERIPHERAL });

        // Set new banker
        const member = await this.memberRepo.findOne({ where: { id: dto.memberId, groupCircle: { id } } });
        if (!member) throw new NotFoundException('Member not found');

        member.role = GroupCircleRole.BANKER;
        return await this.memberRepo.save(member);
    }

    async swapDrawDates(id: string, dto: SwapDrawDatesDto, businessId: string) {
        const circle = await this.findOne(id, businessId);
        if (circle.type !== GroupCircleType.SMART_MONEY) throw new BadRequestException('Only Smart Money circles have draw dates');

        const m1 = await this.memberRepo.findOne({ where: { id: dto.memberId1, groupCircle: { id } } });
        const m2 = await this.memberRepo.findOne({ where: { id: dto.memberId2, groupCircle: { id } } });

        if (!m1 || !m2) throw new NotFoundException('Members not found');

        const temp = m1.drawDate;
        m1.drawDate = m2.drawDate;
        m2.drawDate = temp;

        await this.memberRepo.save([m1, m2]);
        return { message: 'Draw dates swapped' };
    }

    async addMember(id: string, dto: AddMemberDto, businessId: string) {
        const circle = await this.findOne(id, businessId);

        if (circle.type === GroupCircleType.SMART_MONEY) {
            const count = await this.memberRepo.count({ where: { groupCircle: { id: circle.id } } });
            if (count >= 12) throw new BadRequestException('Max 12 members for Smart Money Circle');
        }

        const network = await this.networkRepo.findOne({ where: { id: dto.networkId, business: { id: businessId } } });
        if (!network) throw new NotFoundException('Contact not found');

        const existing = await this.memberRepo.findOne({ where: { groupCircle: { id: circle.id }, network: { id: network.id } } });
        if (existing) throw new BadRequestException('Member already exists');

        const member = this.memberRepo.create({
            groupCircle: circle,
            network,
            role: dto.role || GroupCircleRole.PERIPHERAL
        });

        await this.memberRepo.save(member);
        await this.logActivity(circle, 'MEMBER_ADDED', { networkId: network.id });
        return member;
    }

    async removeMember(id: string, memberId: string, businessId: string) {
        const circle = await this.findOne(id, businessId);
        // memberId is GroupCircleMember id or Network id? Usually ID of the resource being deleted.
        // I'll assume memberId is GroupCircleMember ID.
        const member = await this.memberRepo.findOne({ where: { id: memberId, groupCircle: { id: circle.id } } });
        if (!member) throw new NotFoundException('Member not found');

        if (circle.type === GroupCircleType.SMART_MONEY) {
             const count = await this.memberRepo.count({ where: { groupCircle: { id: circle.id } } });
             if (count <= 6) throw new BadRequestException('Min 6 members for Smart Money Circle');
        }

        await this.memberRepo.remove(member);
        await this.logActivity(circle, 'MEMBER_REMOVED', { memberId });
    }

    async sendMessage(id: string, dto: SendMessageDto, business: Business) {
        const circle = await this.findOne(id, business.id);
        const message = this.messageRepo.create({
            groupCircle: circle,
            content: dto.content,
            senderName: business.name,
            senderId: business.id
        });
        return await this.messageRepo.save(message);
    }

    async getMessages(id: string, businessId: string, page: number = 1, limit: number = 20) {
        await this.findOne(id, businessId); // Check access
        return await this.messageRepo.find({
            where: { groupCircle: { id } },
            order: { created_at: 'DESC' },
            take: limit,
            skip: (page - 1) * limit
        });
    }

    async getActivities(id: string, businessId: string) {
        await this.findOne(id, businessId);
        return await this.activityRepo.find({
            where: { groupCircle: { id } },
            order: { created_at: 'DESC' },
            take: 50
        });
    }

    private async logActivity(circle: GroupCircle, action: string, details: any) {
        const activity = this.activityRepo.create({
            groupCircle: circle,
            action,
            details
        });
        await this.activityRepo.save(activity);
    }
}
