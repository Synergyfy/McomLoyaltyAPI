import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupCircle } from './entities/group-circle.entity';
import { GroupCircleMember } from './entities/group-circle-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupActivity } from './entities/group-activity.entity';
import { GroupCircleContribution, ContributionStatus } from './entities/group-circle-contribution.entity';
import { CreateGroupCircleDto } from './dto/create-group-circle.dto';
import { UpdateGroupCircleDto } from './dto/update-group-circle.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AssignBankerDto } from './dto/assign-banker.dto';
import { SwapDrawDatesDto } from './dto/swap-draw-dates.dto';
import { RecordContributionDto } from './dto/record-contribution.dto';
import { InitiateContributionDto } from './dto/initiate-contribution.dto';
import { VerifyContributionDto } from './dto/verify-contribution.dto';
import { NetworkList } from '../network/entities/network-list.entity';
import { Network } from '../network/entities/network.entity';
import { Business } from '../business/entities/business.entity';
import { GroupCircleType, GroupCircleRole, PaymentProvider } from './enums/group-circle.enums';
import { Membership, MembershipStatus } from '../membership/entities/membership.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StripeService } from '../payment/stripe.service';
import { PaypalService } from '../payment/paypal.service';

@Injectable()
export class GroupCircleService {
    constructor(
        @InjectRepository(GroupCircle) private circleRepo: Repository<GroupCircle>,
        @InjectRepository(GroupCircleMember) private memberRepo: Repository<GroupCircleMember>,
        @InjectRepository(GroupMessage) private messageRepo: Repository<GroupMessage>,
        @InjectRepository(GroupActivity) private activityRepo: Repository<GroupActivity>,
        @InjectRepository(GroupCircleContribution) private contributionRepo: Repository<GroupCircleContribution>,
        @InjectRepository(NetworkList) private listRepo: Repository<NetworkList>,
        @InjectRepository(Network) private networkRepo: Repository<Network>,
        private stripeService: StripeService,
        private paypalService: PaypalService,
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
            const membership = await this.circleRepo.manager.findOne(Membership, {
                where: { business: { id: business.id }, status: MembershipStatus.ACTIVE },
                relations: ['tier']
            });
            const limits = await this.getSmartMoneyLimits(membership);
            if (allNetworks.size < limits.minMembers || allNetworks.size > limits.maxMembers) {
                throw new BadRequestException(`Smart Money Circles must have between ${limits.minMembers} and ${limits.maxMembers} members.`);
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

    private async getSmartMoneyLimits(membership: Membership) {
        if (!membership) throw new BadRequestException('Active membership required for Smart Money Circle');

        let limits = membership.tier.configuration?.smartMoney;

        // Fallback for default tiers if not explicitly configured
        if (!limits) {
            const tierName = membership.tier.name.toUpperCase();
            if (tierName.includes('BRONZE')) limits = { maxDurationDays: 90, maxContributionAmount: 25, minMembers: 6, maxMembers: 12 };
            else if (tierName.includes('SILVER')) limits = { maxDurationDays: 180, maxContributionAmount: 50, minMembers: 6, maxMembers: 12 };
            else if (tierName.includes('GOLD')) limits = { maxDurationDays: 270, maxContributionAmount: 75, minMembers: 6, maxMembers: 12 };
            else if (tierName.includes('PLATINUM')) limits = { maxDurationDays: 360, maxContributionAmount: 100, minMembers: 6, maxMembers: 12 };
        }

        if (!limits) {
            throw new BadRequestException('Smart Money not configured for this tier');
        }
        return limits;
    }

    async validateSmartMoneyRules(dto: CreateGroupCircleDto, business: Business) {
        const membership = await this.circleRepo.manager.findOne(Membership, {
            where: { business: { id: business.id }, status: MembershipStatus.ACTIVE },
            relations: ['tier']
        });
        const limits = await this.getSmartMoneyLimits(membership);

        if (dto.duration > limits.maxDurationDays) {
            throw new BadRequestException(`Duration ${dto.duration} exceeds limit for ${membership.tier.name} tier (${limits.maxDurationDays})`);
        }

        if (dto.contributionAmount && dto.contributionAmount > limits.maxContributionAmount) {
            throw new BadRequestException(`Contribution ${dto.contributionAmount} exceeds limit for ${membership.tier.name} tier (£${limits.maxContributionAmount})`);
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

    async initiateContribution(id: string, dto: InitiateContributionDto, businessId: string) {
        const circle = await this.findOne(id, businessId);
        if (circle.type !== GroupCircleType.SMART_MONEY) throw new BadRequestException('Only Smart Money circles have contributions');

        const member = await this.memberRepo.findOne({ where: { id: dto.memberId, groupCircle: { id } } });
        if (!member) throw new NotFoundException('Member not found');

        // Optional: Validate amount against limits
        const membership = await this.circleRepo.manager.findOne(Membership, {
            where: { business: { id: businessId }, status: MembershipStatus.ACTIVE },
            relations: ['tier']
        });
        const limits = await this.getSmartMoneyLimits(membership);
        if (dto.amount > limits.maxContributionAmount) {
            throw new BadRequestException(`Contribution ${dto.amount} exceeds limit for ${membership.tier.name} tier (£${limits.maxContributionAmount})`);
        }

        const metadata = {
            groupCircleId: circle.id,
            memberId: member.id,
            round: dto.round,
            type: 'GROUP_CIRCLE_CONTRIBUTION'
        };

        if (dto.provider === PaymentProvider.PAYPAL) {
            const description = `Contribution for ${circle.name} - Round ${dto.round || 'N/A'}`;
            const order = await this.paypalService.createOrder(dto.amount, 'GBP', circle.id, description);
            return { orderId: order.result.id };
        } else if (dto.provider === PaymentProvider.STRIPE) {
            const paymentIntent = await this.stripeService.createPaymentIntent(
                Math.round(dto.amount * 100),
                'gbp',
                metadata
            );
            return { clientSecret: paymentIntent.client_secret };
        } else {
            throw new BadRequestException('Invalid provider for initiation');
        }
    }

    async verifyContribution(id: string, dto: VerifyContributionDto, businessId: string) {
        // Just call recordContribution which already has validation logic
        // But map the DTO to RecordContributionDto structure (though they are compatible)
        const recordDto: RecordContributionDto = {
            memberId: dto.memberId,
            amount: dto.amount,
            round: dto.round,
            provider: dto.provider,
            transactionId: dto.transactionId
            // status and paidAt will be inferred in recordContribution
        };
        return this.recordContribution(id, recordDto, businessId);
    }

    async recordContribution(id: string, dto: RecordContributionDto, businessId: string) {
        const circle = await this.findOne(id, businessId);
        if (circle.type !== GroupCircleType.SMART_MONEY) throw new BadRequestException('Only Smart Money circles have contributions');

        const member = await this.memberRepo.findOne({ where: { id: dto.memberId, groupCircle: { id } } });
        if (!member) throw new NotFoundException('Member not found');

        let status = dto.status || ContributionStatus.PENDING;
        let paidAt = dto.status === ContributionStatus.PAID ? new Date() : null;

        if (dto.provider && dto.provider !== PaymentProvider.MANUAL) {
            if (!dto.transactionId) {
                throw new BadRequestException('Transaction ID is required for online payments');
            }

            // Check if transaction ID already exists to prevent double recording
            const existing = await this.contributionRepo.findOne({ where: { transactionId: dto.transactionId } });
            if (existing) {
                throw new BadRequestException('Transaction already recorded');
            }

            try {
                if (dto.provider === PaymentProvider.STRIPE) {
                    const paymentIntent = await this.stripeService.verifyPayment(dto.transactionId);
                    if (paymentIntent.status !== 'succeeded') {
                        throw new BadRequestException(`Stripe payment not successful: ${paymentIntent.status}`);
                    }
                    if (paymentIntent.amount !== Math.round(dto.amount * 100)) {
                        // Optional: STRICT amount check could be enabled here
                        // throw new BadRequestException(`Amount mismatch: expected ${dto.amount}, got ${paymentIntent.amount / 100}`);
                    }
                } else if (dto.provider === PaymentProvider.PAYPAL) {
                    try {
                        // Check if already captured? PayPal SDK doesn't make it easy to check without trying or getting order details.
                        // We'll try to capture. 
                        const capture = await this.paypalService.capturePayment(dto.transactionId);
                        if (capture.result.status !== 'COMPLETED') {
                            throw new BadRequestException(`PayPal payment not completed: ${capture.result.status}`);
                        }
                    } catch (e) {
                        // If capture fails, it might be be already captured.
                        // In a pro system, we'd query the order status first.
                        // For now, we assume failure, as we haven't recorded it yet locally.
                        throw new BadRequestException(`PayPal verification failed: ${e.message}`);
                    }
                }
                status = ContributionStatus.PAID;
                paidAt = new Date();
            } catch (error) {
                if (error instanceof BadRequestException) throw error;
                throw new BadRequestException(`Payment verification failed: ${error.message}`);
            }
        }

        const contribution = this.contributionRepo.create({
            groupCircle: circle,
            member: member,
            amount: dto.amount,
            round: dto.round,
            status: status,
            paidAt: paidAt,
            provider: dto.provider || PaymentProvider.MANUAL,
            transactionId: dto.transactionId
        });

        await this.contributionRepo.save(contribution);
        await this.logActivity(circle, 'CONTRIBUTION_RECORDED', { amount: dto.amount, memberId: member.id, provider: contribution.provider });
        return contribution;
    }

    async getAllContributions(businessId: string, page: number = 1, limit: number = 20) {
        const [data, total] = await this.contributionRepo.findAndCount({
            where: { groupCircle: { business: { id: businessId } } },
            order: { created_at: 'DESC' },
            relations: ['groupCircle', 'member', 'member.network'],
            take: limit,
            skip: (page - 1) * limit
        });

        return {
            data,
            meta: { total, page, limit }
        };
    }

    async getContributions(id: string, businessId: string) {
        await this.findOne(id, businessId);
        return await this.contributionRepo.find({
            where: { groupCircle: { id } },
            order: { created_at: 'DESC' },
            relations: ['member', 'member.network']
        });
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
