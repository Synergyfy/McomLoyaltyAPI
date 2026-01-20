import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, EntityManager } from "typeorm";
import { GroupCircle } from "./entities/group-circle.entity";
import { GroupCircleMember } from "./entities/group-circle-member.entity";
import { GroupMessage } from "./entities/group-message.entity";
import { GroupActivity } from "./entities/group-activity.entity";
import {
  GroupCircleContribution,
  ContributionStatus,
} from "./entities/group-circle-contribution.entity";
import { CreateGroupCircleDto } from "./dto/create-group-circle.dto";
import { UpdateGroupCircleDto } from "./dto/update-group-circle.dto";
import { AddMemberDto } from "./dto/add-member.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { AssignBankerDto } from "./dto/assign-banker.dto";
import { SwapDrawDatesDto } from "./dto/swap-draw-dates.dto";
import { RecordContributionDto } from "./dto/record-contribution.dto";
import { InitiateContributionDto } from "./dto/initiate-contribution.dto";
import { VerifyContributionDto } from "./dto/verify-contribution.dto";
import { Network, NetworkStatus } from "../network/entities/network.entity";
import { Business } from "../business/entities/business.entity";
import {
  GroupCircleType,
  GroupCircleRole,
  PaymentProvider,
  GroupMessageType,
} from "./enums/group-circle.enums";
import {
  Membership,
  MembershipStatus,
} from "../membership/entities/membership.entity";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { StripeService } from "../payment/stripe.service";
import { PaypalService } from "../payment/paypal.service";
import { Referral, ReferralStatus } from "../referral/entities/referral.entity";
import { NetworkRelationshipTag } from "../../common/enums/network-tags.enum";

@Injectable()
export class GroupCircleService {
  constructor(
    @InjectRepository(GroupCircle) private circleRepo: Repository<GroupCircle>,
    @InjectRepository(GroupCircleMember)
    private memberRepo: Repository<GroupCircleMember>,
    @InjectRepository(GroupMessage)
    private messageRepo: Repository<GroupMessage>,
    @InjectRepository(GroupActivity)
    private activityRepo: Repository<GroupActivity>,
    @InjectRepository(GroupCircleContribution)
    private contributionRepo: Repository<GroupCircleContribution>,
    @InjectRepository(Network) private networkRepo: Repository<Network>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    private stripeService: StripeService,
    private paypalService: PaypalService,
  ) {}

  async create(createDto: CreateGroupCircleDto, business: Business) {
    if (!business || !business.id) {
      throw new BadRequestException("Invalid business context");
    }

    const uniqueNetworkIds = [...new Set(createDto.networkIds || [])];
    const uniqueReferredBusinessIds = [
      ...new Set(createDto.referredBusinessIds || []),
    ];

    if (
      uniqueNetworkIds.length === 0 &&
      uniqueReferredBusinessIds.length === 0
    ) {
      throw new BadRequestException(
        "At least one network contact or referred business is required",
      );
    }

    // Validate Networks first
    const networks: Network[] = [];
    if (uniqueNetworkIds.length > 0) {
      const foundNetworks = await this.networkRepo.find({
        where: {
          id: In(uniqueNetworkIds),
          business: { id: business.id },
        },
      });

      if (foundNetworks.length !== uniqueNetworkIds.length) {
        throw new NotFoundException(
          "Some network contacts were not found or do not belong to your business",
        );
      }
      networks.push(...foundNetworks);
    }

    // Resolve referred businesses
    if (uniqueReferredBusinessIds.length > 0) {
      const resolvedNetworks = await this.resolveReferredBusinesses(
        uniqueReferredBusinessIds,
        business,
      );
      networks.push(...resolvedNetworks);
    }

    return await this.circleRepo.manager.transaction(
      async (manager: EntityManager) => {
        // Ensure owner is included
        const ownerNetwork = await this.getOrCreateOwnerNetwork(
          business,
          manager,
        );

        // Add owner to networks if not already present
        const isOwnerPresent = networks.some((n) => n.id === ownerNetwork.id);
        if (!isOwnerPresent) {
          networks.push(ownerNetwork);
        }

        if (createDto.type === GroupCircleType.SMART_MONEY) {
          await this.validateSmartMoneyRules(createDto, business, manager);

          const membership = await manager.findOne(Membership, {
            where: {
              business: { id: business.id },
              status: MembershipStatus.ACTIVE,
            },
            relations: ["tier"],
          });

          const limits = await this.getSmartMoneyLimits(membership);
          if (
            networks.length < limits.minMembers ||
            networks.length > limits.maxMembers
          ) {
            throw new BadRequestException(
              `Smart Money Circles must have between ${limits.minMembers} and ${limits.maxMembers} members.`,
            );
          }
        }

        const { networkIds, ...dtoData } = createDto;

        const circle = manager.create(GroupCircle, {
          ...dtoData,
          business,
          startDate: new Date(),
          payoutFrequency:
            createDto.type === GroupCircleType.SMART_MONEY
              ? "WEEKLY"
              : undefined,
        });

        const savedCircle = await manager.save(GroupCircle, circle);

        const members: GroupCircleMember[] = [];
        const baseDate = savedCircle.startDate
          ? new Date(savedCircle.startDate)
          : new Date();

        for (let index = 0; index < networks.length; index++) {
          const net = networks[index];

          // Check for business referral restriction
          if (
            net.isOnboarded &&
            net.onboardedType === "business" &&
            net.onboardedBusinessId &&
            net.id !== ownerNetwork.id
          ) {
            const referral = await manager.findOne(Referral, {
              where: {
                referrerBusiness: { id: business.id },
                refereeBusiness: { id: net.onboardedBusinessId },
                status: ReferralStatus.SUCCESSFUL,
              },
            });

            if (!referral) {
              throw new BadRequestException(
                `Cannot add business '${net.businessName || net.fullName}' as they were not referred by you.`,
              );
            }
          }

          const member = manager.create(GroupCircleMember, {
            groupCircle: savedCircle,
            network: net,
            role:
              net.id === ownerNetwork.id
                ? GroupCircleRole.CORE
                : GroupCircleRole.PERIPHERAL, // Owner is CORE
          });

          if (createDto.type === GroupCircleType.SMART_MONEY) {
            const drawDate = new Date(baseDate);
            drawDate.setDate(baseDate.getDate() + index * 7);
            member.drawDate = drawDate;
          }
          members.push(member);
        }

        await manager.save(GroupCircleMember, members);
        await this.logActivity(
          savedCircle,
          "CREATED",
          { by: business.id },
          manager,
        );

        savedCircle.members = members;
        return savedCircle;
      },
    );
  }

  private async getOrCreateOwnerNetwork(
    business: Business,
    manager: EntityManager,
  ): Promise<Network> {
    let ownerNetwork = await manager.findOne(Network, {
      where: {
        business: { id: business.id },
        email: business.email,
      },
    });

    if (!ownerNetwork) {
      let name = business.name;
      let phone = business.phone;

      if (!name) {
        const fullBusiness = await manager.findOne(Business, {
          where: { id: business.id },
        });
        if (fullBusiness) {
          name = fullBusiness.name;
          phone = fullBusiness.phone;
        }
      }

      ownerNetwork = manager.create(Network, {
        business: business,
        fullName: name || "Business Owner",
        email: business.email,
        phone: phone || "N/A", // Fallback if phone is missing
        status: NetworkStatus.ACCEPTED,
        isOnboarded: true,
        onboardedType: "business",
        onboardedBusinessId: business.id,
      });
      await manager.save(Network, ownerNetwork);
    }
    return ownerNetwork;
  }

  private async getSmartMoneyLimits(membership: Membership) {
    if (!membership)
      throw new BadRequestException(
        "Active membership required for Smart Money Circle",
      );

    // Ensure tier is loaded
    if (!membership.tier) {
      // This should ideally not happen if query includes relations, but for safety:
      throw new InternalServerErrorException("Membership tier data missing");
    }

    let limits = membership.tier.configuration?.smartMoney;

    // Fallback for default tiers if not explicitly configured
    if (!limits) {
      const tierName = membership.tier.name
        ? membership.tier.name.toUpperCase()
        : "";
      if (tierName.includes("BRONZE"))
        limits = {
          maxDurationDays: 90,
          maxContributionAmount: 25,
          minMembers: 6,
          maxMembers: 12,
        };
      else if (tierName.includes("SILVER"))
        limits = {
          maxDurationDays: 180,
          maxContributionAmount: 50,
          minMembers: 6,
          maxMembers: 12,
        };
      else if (tierName.includes("GOLD"))
        limits = {
          maxDurationDays: 270,
          maxContributionAmount: 75,
          minMembers: 6,
          maxMembers: 12,
        };
      else if (tierName.includes("PLATINUM"))
        limits = {
          maxDurationDays: 360,
          maxContributionAmount: 100,
          minMembers: 6,
          maxMembers: 12,
        };
    }

    if (!limits) {
      throw new BadRequestException("Smart Money not configured for this tier");
    }
    return limits;
  }

  async validateSmartMoneyRules(
    dto: CreateGroupCircleDto | any,
    business: Business,
    manager?: EntityManager,
  ) {
    const repo = manager || this.circleRepo.manager;
    const membership = await repo.findOne(Membership, {
      where: { business: { id: business.id }, status: MembershipStatus.ACTIVE },
      relations: ["tier"],
    });

    const limits = await this.getSmartMoneyLimits(membership);

    if (dto.duration > limits.maxDurationDays) {
      throw new BadRequestException(
        `Duration ${dto.duration} exceeds limit for ${membership.tier.name} tier (${limits.maxDurationDays})`,
      );
    }

    if (
      dto.contributionAmount &&
      dto.contributionAmount > limits.maxContributionAmount
    ) {
      throw new BadRequestException(
        `Contribution ${dto.contributionAmount} exceeds limit for ${membership.tier.name} tier (${limits.maxContributionAmount})`,
      );
    }
  }

  async findAll(query: PaginationDto, businessId: string) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10)); // Enforce max limit of 100
    const skip = (page - 1) * limit;

    const [data, total] = await this.circleRepo.findAndCount({
      where: { business: { id: businessId } },
      take: limit,
      skip,
      order: { created_at: "DESC" },
      relations: ["members", "members.network"],
    });

    const lastPage = Math.ceil(total / limit);
    const nextPage = page < lastPage ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
        nextPage,
        prevPage,
      },
    };
  }

  async findOne(id: string, businessId: string) {
    const circle = await this.circleRepo.findOne({
      where: { id, business: { id: businessId } },
      relations: ["members", "members.network"],
    });
    if (!circle) throw new NotFoundException("Group Circle not found");
    return circle;
  }

  async update(id: string, dto: UpdateGroupCircleDto, businessId: string) {
    const circle = await this.findOne(id, businessId);

    // We ignore networkIds in update for now as membership is handled via add/remove member
    // If updating networks is required here, it should be done carefully to not break state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { networkIds, ...data } = dto;

    Object.assign(circle, data);
    if (
      circle.type === GroupCircleType.SMART_MONEY &&
      (data.duration || data.contributionAmount)
    ) {
      // Map circle to a pseudo-DTO for validation
      const validateDto: any = {
        type: circle.type,
        duration: data.duration ?? circle.duration,
        contributionAmount:
          data.contributionAmount ?? circle.contributionAmount,
      };

      const business = await this.circleRepo.manager.findOne(Business, {
        where: { id: businessId },
      });
      await this.validateSmartMoneyRules(validateDto, business);
    }

    return await this.circleRepo.save(circle);
  }

  async assignBanker(id: string, dto: AssignBankerDto, businessId: string) {
    await this.findOne(id, businessId); // Check access

    return await this.circleRepo.manager.transaction(async (manager) => {
      // Unset previous banker
      await manager.update(
        GroupCircleMember,
        { groupCircle: { id }, role: GroupCircleRole.BANKER },
        { role: GroupCircleRole.PERIPHERAL },
      );

      // Set new banker
      const member = await manager.findOne(GroupCircleMember, {
        where: { id: dto.memberId, groupCircle: { id } },
      });
      if (!member) throw new NotFoundException("Member not found");

      member.role = GroupCircleRole.BANKER;
      return await manager.save(member);
    });
  }

  async swapDrawDates(id: string, dto: SwapDrawDatesDto, businessId: string) {
    const circle = await this.findOne(id, businessId);
    if (circle.type !== GroupCircleType.SMART_MONEY)
      throw new BadRequestException("Only Smart Money circles have draw dates");

    if (dto.memberId1 === dto.memberId2) {
      throw new BadRequestException("Cannot swap date with same member");
    }

    return await this.circleRepo.manager.transaction(async (manager) => {
      const m1 = await manager.findOne(GroupCircleMember, {
        where: { id: dto.memberId1, groupCircle: { id } },
      });
      const m2 = await manager.findOne(GroupCircleMember, {
        where: { id: dto.memberId2, groupCircle: { id } },
      });

      if (!m1 || !m2)
        throw new NotFoundException("One or both members not found");

      const temp = m1.drawDate;
      m1.drawDate = m2.drawDate;
      m2.drawDate = temp;

      await manager.save([m1, m2]);
      return { message: "Draw dates swapped" };
    });
  }

  async initiateContribution(
    id: string,
    dto: InitiateContributionDto,
    businessId: string,
  ) {
    const circle = await this.findOne(id, businessId);
    if (circle.type !== GroupCircleType.SMART_MONEY)
      throw new BadRequestException(
        "Only Smart Money circles have contributions",
      );

    const member = await this.memberRepo.findOne({
      where: { id: dto.memberId, groupCircle: { id } },
    });
    if (!member) throw new NotFoundException("Member not found");

    // Optional: Validate amount against limits
    const membership = await this.circleRepo.manager.findOne(Membership, {
      where: { business: { id: businessId }, status: MembershipStatus.ACTIVE },
      relations: ["tier"],
    });
    const limits = await this.getSmartMoneyLimits(membership);
    if (dto.amount > limits.maxContributionAmount) {
      throw new BadRequestException(
        `Contribution ${dto.amount} exceeds limit for ${membership.tier.name} tier (${limits.maxContributionAmount})`,
      );
    }

    const metadata = {
      groupCircleId: circle.id,
      memberId: member.id,
      round: dto.round,
      type: "GROUP_CIRCLE_CONTRIBUTION",
    };

    try {
      if (dto.provider === PaymentProvider.PAYPAL) {
        const description = `Contribution for ${circle.name} - Round ${dto.round || "N/A"}`;
        const order = await this.paypalService.createOrder(
          dto.amount,
          "GBP",
          circle.id,
          description,
        );
        return { orderId: order.result.id };
      } else if (dto.provider === PaymentProvider.STRIPE) {
        const paymentIntent = await this.stripeService.createPaymentIntent(
          Math.round(dto.amount * 100),
          "gbp",
          metadata,
        );
        return { clientSecret: paymentIntent.client_secret };
      } else {
        throw new BadRequestException("Invalid provider for initiation");
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // Log the error internally here if you have a logger
      throw new ServiceUnavailableException(
        `Payment provider error: ${error.message}`,
      );
    }
  }

  async verifyContribution(
    id: string,
    dto: VerifyContributionDto,
    businessId: string,
  ) {
    const recordDto: RecordContributionDto = {
      memberId: dto.memberId,
      amount: dto.amount,
      round: dto.round,
      provider: dto.provider,
      transactionId: dto.transactionId,
    };
    return this.recordContribution(id, recordDto, businessId);
  }

  async recordContribution(
    id: string,
    dto: RecordContributionDto,
    businessId: string,
  ) {
    const circle = await this.findOne(id, businessId);
    if (circle.type !== GroupCircleType.SMART_MONEY)
      throw new BadRequestException(
        "Only Smart Money circles have contributions",
      );

    const member = await this.memberRepo.findOne({
      where: { id: dto.memberId, groupCircle: { id } },
    });
    if (!member) throw new NotFoundException("Member not found");

    let status = dto.status || ContributionStatus.PENDING;
    let paidAt = dto.status === ContributionStatus.PAID ? new Date() : null;

    if (dto.provider && dto.provider !== PaymentProvider.MANUAL) {
      if (!dto.transactionId) {
        throw new BadRequestException(
          "Transaction ID is required for online payments",
        );
      }

      if (dto.transactionId) {
        const existing = await this.contributionRepo.findOne({
          where: { transactionId: dto.transactionId },
        });
        if (existing) {
          throw new BadRequestException("Transaction already recorded");
        }
      }

      try {
        if (dto.provider === PaymentProvider.STRIPE) {
          const paymentIntent = await this.stripeService.verifyPayment(
            dto.transactionId,
          );
          if (paymentIntent.status !== "succeeded") {
            throw new BadRequestException(
              `Stripe payment not successful: ${paymentIntent.status}`,
            );
          }
        } else if (dto.provider === PaymentProvider.PAYPAL) {
          try {
            const capture = await this.paypalService.capturePayment(
              dto.transactionId,
            );
            if (capture.result.status !== "COMPLETED") {
              throw new BadRequestException(
                `PayPal payment not completed: ${capture.result.status}`,
              );
            }
          } catch (e) {
            throw new BadRequestException(
              `PayPal verification failed: ${e.message}`,
            );
          }
        }
        status = ContributionStatus.PAID;
        paidAt = new Date();
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException(
          `Payment verification failed: ${error.message}`,
        );
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
      transactionId: dto.transactionId,
    });

    await this.contributionRepo.save(contribution);
    await this.logActivity(circle, "CONTRIBUTION_RECORDED", {
      amount: dto.amount,
      memberId: member.id,
      provider: contribution.provider,
    });
    return contribution;
  }

  async getAllContributions(
    businessId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 20));

    const [data, total] = await this.contributionRepo.findAndCount({
      where: { groupCircle: { business: { id: businessId } } },
      order: { created_at: "DESC" },
      relations: ["groupCircle", "member", "member.network"],
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const lastPage = Math.ceil(total / limitNum);
    const nextPage = pageNum < lastPage ? pageNum + 1 : null;
    const prevPage = pageNum > 1 ? pageNum - 1 : null;

    return {
      data,
      meta: {
        total,
        page: pageNum,
        lastPage,
        nextPage,
        prevPage,
      },
    };
  }

  async getContributions(id: string, businessId: string) {
    await this.findOne(id, businessId);
    const data = await this.contributionRepo.find({
      where: { groupCircle: { id } },
      order: { created_at: "DESC" },
      relations: ["member", "member.network"],
      take: 100, // Enforce a reasonable limit for non-paginated endpoint too
    });
    return { data };
  }

  async addMember(id: string, dto: AddMemberDto, businessId: string) {
    if (!dto.networkId && !dto.referredBusinessId) {
      throw new BadRequestException(
        "Either networkId or referredBusinessId must be provided",
      );
    }

    const circle = await this.findOne(id, businessId);

    if (circle.type === GroupCircleType.SMART_MONEY) {
      const count = await this.memberRepo.count({
        where: { groupCircle: { id: circle.id } },
      });
      if (count >= 12)
        throw new BadRequestException("Max 12 members for Smart Money Circle");
    }

    let network: Network;

    if (dto.networkId) {
      network = await this.networkRepo.findOne({
        where: { id: dto.networkId, business: { id: businessId } },
      });
      if (!network) throw new NotFoundException("Contact not found");
    } else if (dto.referredBusinessId) {
      const resolved = await this.resolveReferredBusinesses(
        [dto.referredBusinessId],
        { id: businessId } as Business,
      );
      if (resolved.length === 0) {
        throw new BadRequestException("Could not resolve referred business");
      }
      network = resolved[0];
    }

    const existing = await this.memberRepo.findOne({
      where: { groupCircle: { id: circle.id }, network: { id: network.id } },
    });
    if (existing) throw new BadRequestException("Member already exists");

    // Check for business referral restriction
    // This check is still valid but if we resolved via referredBusinessId, we already checked referral status.
    // However, if we came via networkId, we still need this check.
    // The resolveReferredBusinesses checks referral status, so if it passed, we are good.
    // But if we used networkId for an existing business contact, we re-verify.
    if (
      network.isOnboarded &&
      network.onboardedType === "business" &&
      network.onboardedBusinessId &&
      !dto.referredBusinessId // Skip if we just verified it via resolveReferredBusinesses
    ) {
      const referral = await this.referralRepo.findOne({
        where: {
          referrerBusiness: { id: businessId },
          refereeBusiness: { id: network.onboardedBusinessId },
          status: ReferralStatus.SUCCESSFUL,
        },
      });

      if (!referral) {
        throw new BadRequestException(
          `Cannot add business '${network.businessName || network.fullName}' as they were not referred by you.`,
        );
      }
    }

    const member = this.memberRepo.create({
      groupCircle: circle,
      network,
      role: dto.role || GroupCircleRole.PERIPHERAL,
    });

    await this.memberRepo.save(member);
    await this.logActivity(circle, "MEMBER_ADDED", { networkId: network.id });
    return member;
  }

  private async resolveReferredBusinesses(
    referredBusinessIds: string[],
    currentBusiness: Business,
  ): Promise<Network[]> {
    const networks: Network[] = [];

    // 1. Fetch valid referrals
    const referrals = await this.referralRepo.find({
      where: {
        referrerBusiness: { id: currentBusiness.id },
        refereeBusiness: { id: In(referredBusinessIds) },
        status: ReferralStatus.SUCCESSFUL,
      },
      relations: ["refereeBusiness"],
    });

    const validReferralIds = referrals.map((r) => r.refereeBusiness.id);
    const invalidIds = referredBusinessIds.filter(
      (id) => !validReferralIds.includes(id),
    );

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `One or more businesses were not referred by you or the referral is not successful: ${invalidIds.join(", ")}`,
      );
    }

    for (const referral of referrals) {
      const refereeBiz = referral.refereeBusiness;

      // 2. Check if network exists
      let network = await this.networkRepo.findOne({
        where: {
          business: { id: currentBusiness.id },
          onboardedBusinessId: refereeBiz.id,
          isOnboarded: true,
          onboardedType: "business",
        },
      });

      if (!network) {
        // Check by email as fallback
        network = await this.networkRepo.findOne({
          where: {
            business: { id: currentBusiness.id },
            email: refereeBiz.email,
          },
        });
      }

      // 3. Create if not exists or update
      if (!network) {
        network = this.networkRepo.create({
          business: currentBusiness,
          fullName: refereeBiz.name,
          businessName: refereeBiz.name,
          email: refereeBiz.email,
          phone: refereeBiz.phone || "N/A",
          status: NetworkStatus.ACCEPTED,
          isOnboarded: true,
          onboardedType: "business",
          onboardedBusinessId: refereeBiz.id,
          relationshipTag: NetworkRelationshipTag.PARTNER, // Default tag for referred business
        });
        await this.networkRepo.save(network);
      } else {
        // Ensure it's linked correctly if found by email
        if (!network.isOnboarded || !network.onboardedBusinessId) {
          network.isOnboarded = true;
          network.onboardedType = "business";
          network.onboardedBusinessId = refereeBiz.id;
          network.businessName = refereeBiz.name; // Update name
          await this.networkRepo.save(network);
        }
      }
      networks.push(network);
    }

    return networks;
  }

  async removeMember(id: string, memberId: string, businessId: string) {
    const circle = await this.findOne(id, businessId);

    const member = await this.memberRepo.findOne({
      where: { id: memberId, groupCircle: { id: circle.id } },
    });
    if (!member) throw new NotFoundException("Member not found");

    if (circle.type === GroupCircleType.SMART_MONEY) {
      const count = await this.memberRepo.count({
        where: { groupCircle: { id: circle.id } },
      });
      if (count <= 6)
        throw new BadRequestException("Min 6 members for Smart Money Circle");
    }

    await this.memberRepo.remove(member);
    await this.logActivity(circle, "MEMBER_REMOVED", { memberId });
  }

  async sendMessage(id: string, dto: SendMessageDto, business: Business) {
    const circle = await this.findOne(id, business.id);

    let type = GroupMessageType.GROUP;
    let recipientName = null;
    let senderName = business.name;
    const senderId = dto.senderId || business.id;

    if (!senderName && senderId === business.id) {
      const fullBusiness = await this.circleRepo.manager.findOne(Business, {
        where: { id: business.id },
      });
      senderName = fullBusiness?.name || "Business Owner";
    }

    if (dto.senderId && dto.senderId !== business.id) {
      const senderMember = await this.memberRepo.findOne({
        where: { groupCircle: { id }, network: { id: dto.senderId } },
        relations: ["network"],
      });

      if (!senderMember) {
        throw new BadRequestException("Sender not found in this group");
      }

      // Null check for relation
      if (!senderMember.network) {
        throw new NotFoundException("Sender network profile data is missing");
      }

      senderName = senderMember.network.fullName;
    }

    if (dto.recipientId) {
      const recipientMember = await this.memberRepo.findOne({
        where: {
          groupCircle: { id },
          network: { id: dto.recipientId },
        },
        relations: ["network"],
      });

      if (!recipientMember) {
        throw new NotFoundException("Recipient not found in this group circle");
      }

      if (!recipientMember.network) {
        throw new NotFoundException(
          "Recipient network profile data is missing",
        );
      }

      type = GroupMessageType.DIRECT;
      recipientName = recipientMember.network.fullName;
    }

    const message = this.messageRepo.create({
      groupCircle: circle,
      content: dto.content,
      senderName: senderName,
      senderId: senderId,
      type: type,
      recipientId: dto.recipientId || null,
      recipientName: recipientName,
    });

    return await this.messageRepo.save(message);
  }

  async getMessages(
    id: string,
    businessId: string,
    page: number = 1,
    limit: number = 20,
    type?: GroupMessageType,
    memberId?: string,
  ) {
    await this.findOne(id, businessId);

    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 20));

    const where: any = { groupCircle: { id } };

    if (type) {
      where.type = type;
    }

    if (memberId) {
      const baseWhere = { groupCircle: { id }, ...(type && { type }) };

      const [data, total] = await this.messageRepo.findAndCount({
        where: [
          { ...baseWhere, senderId: memberId },
          { ...baseWhere, recipientId: memberId },
        ],
        order: { created_at: "DESC" },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
      });

      const lastPage = Math.ceil(total / limitNum);
      return {
        data,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          lastPage,
          nextPage: pageNum < lastPage ? pageNum + 1 : null,
          prevPage: pageNum > 1 ? pageNum - 1 : null,
        },
      };
    }

    const [data, total] = await this.messageRepo.findAndCount({
      where,
      order: { created_at: "DESC" },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const lastPage = Math.ceil(total / limitNum);
    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        lastPage,
        nextPage: pageNum < lastPage ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
      },
    };
  }

  async getActivities(id: string, businessId: string) {
    await this.findOne(id, businessId);
    const data = await this.activityRepo.find({
      where: { groupCircle: { id } },
      order: { created_at: "DESC" },
      take: 50,
    });
    return { data };
  }

  private async logActivity(
    circle: GroupCircle,
    action: string,
    details: any,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(GroupActivity)
      : this.activityRepo;
    const activity = repo.create({
      groupCircle: circle,
      action,
      details,
    });
    await repo.save(activity);
  }

  // Network Contact Specific Methods

  private async resolveNetworkIds(
    userId: string,
    email: string,
    role: string,
  ): Promise<string[]> {
    if (role === "Network") {
      if (!email) {
        // Should not happen with valid JWT, but safe guard
        return [];
      }
      const networks = await this.networkRepo.find({
        where: { email: email },
      });
      return networks.map((n) => n.id);
    }
    // Fallback or other roles
    return [userId];
  }

  async findAllNetwork(userId: string, email: string, role: string) {
    const networkIds = await this.resolveNetworkIds(userId, email, role);

    if (networkIds.length === 0) return [];

    return this.circleRepo
      .createQueryBuilder("circle")
      .innerJoin("circle.members", "member")
      .innerJoin("member.network", "network")
      .where("network.id IN (:...networkIds)", { networkIds })
      .leftJoinAndSelect("circle.members", "members")
      .leftJoinAndSelect("members.network", "n")
      .orderBy("circle.created_at", "DESC")
      .getMany();
  }

  async findOneNetwork(
    id: string,
    userId: string,
    email: string,
    role: string,
  ) {
    const networkIds = await this.resolveNetworkIds(userId, email, role);
    const circle = await this.circleRepo.findOne({
      where: { id },
      relations: ["members", "members.network"],
    });

    if (!circle) throw new NotFoundException("Group Circle not found");

    const isMember = circle.members.some((m) =>
      networkIds.includes(m.network.id),
    );
    if (!isMember) {
      throw new BadRequestException("You are not a member of this circle");
    }

    return circle;
  }

  async sendMessageAsNetwork(
    id: string,
    dto: SendMessageDto,
    userId: string,
    email: string,
    role: string,
  ) {
    const networkIds = await this.resolveNetworkIds(userId, email, role);
    // Reuse finding logic which validates membership
    const circle = await this.findOneNetwork(id, userId, email, role);

    // Identify which network ID is the sender in THIS circle
    const senderMember = circle.members.find((m) =>
      networkIds.includes(m.network.id),
    );

    if (!senderMember)
      throw new BadRequestException("You are not a member of this circle");

    let type = GroupMessageType.GROUP;
    let recipientName = null;

    if (dto.recipientId) {
      const recipientMember = circle.members.find(
        (m) => m.network.id === dto.recipientId,
      );
      if (!recipientMember) {
        throw new NotFoundException("Recipient not found in this group circle");
      }
      type = GroupMessageType.DIRECT;
      recipientName = recipientMember.network.fullName;
    }

    const message = this.messageRepo.create({
      groupCircle: circle,
      content: dto.content,
      senderName: senderMember.network.fullName,
      senderId: senderMember.network.id, // Use actual network ID
      type: type,
      recipientId: dto.recipientId || null,
      recipientName: recipientName,
    });

    return await this.messageRepo.save(message);
  }

  async getMessagesNetwork(
    id: string,
    userId: string,
    email: string,
    page: number = 1,
    limit: number = 20,
    type?: GroupMessageType,
    role?: string,
  ) {
    const networkIds = await this.resolveNetworkIds(userId, email, role || "");
    await this.findOneNetwork(id, userId, email, role || ""); // Check access

    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 20));

    const qb = this.messageRepo.createQueryBuilder("message");
    qb.where("message.groupCircleId = :id", { id });

    if (type === GroupMessageType.GROUP) {
      qb.andWhere("message.type = :type", { type: GroupMessageType.GROUP });
    } else if (type === GroupMessageType.DIRECT) {
      qb.andWhere("message.type = :type", { type: GroupMessageType.DIRECT });
      qb.andWhere(
        "(message.senderId IN (:...networkIds) OR message.recipientId IN (:...networkIds))",
        { networkIds },
      );
    } else {
      qb.andWhere(
        "(message.type = :groupType OR (message.type = :directType AND (message.senderId IN (:...networkIds) OR message.recipientId IN (:...networkIds))))",
        {
          groupType: GroupMessageType.GROUP,
          directType: GroupMessageType.DIRECT,
          networkIds,
        },
      );
    }

    qb.orderBy("message.created_at", "DESC");
    qb.take(limitNum).skip((pageNum - 1) * limitNum);

    const [data, total] = await qb.getManyAndCount();

    const lastPage = Math.ceil(total / limitNum);
    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        lastPage,
        nextPage: pageNum < lastPage ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
      },
    };
  }
}
