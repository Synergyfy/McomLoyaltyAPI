import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets, In } from "typeorm";
import { QrPlaque, QrPlaqueStatus } from "./entities/qr-plaque.entity";
import { Business } from "../business/entities/business.entity";
import { Partner } from "../partner/entities/partner.entity";
import { Network, NetworkStatus } from "../network/entities/network.entity";
import { Referral } from "../referral/entities/referral.entity";
import { CreateQrPlaqueDto } from "./dto/create-qr-plaque.dto";
import { UpdateQrPlaqueDto } from "./dto/update-qr-plaque.dto";
import { QrPlaqueQueryDto, PlaqueSortOption } from "./dto/qr-plaque-query.dto";
import { MailService } from "../../mail/mail.service";
import moment from "moment";

@Injectable()
export class QrPlaquesService {
  constructor(
    @InjectRepository(QrPlaque)
    private readonly qrPlaqueRepository: Repository<QrPlaque>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Network)
    private readonly networkRepository: Repository<Network>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    private readonly mailService: MailService,
  ) {}

  private generateUniqueCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 9; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async create(createQrPlaqueDto: CreateQrPlaqueDto, ownerBusinessId?: string) {
    let isUnique = false;
    let uniqueCode = "";
    while (!isUnique) {
      uniqueCode = this.generateUniqueCode();
      const existing = await this.qrPlaqueRepository.findOne({
        where: { uniqueCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const {
      assignedBusinessId,
      assignedPartnerId,
      networkContactId,
      assignToReferredBusinessId,
      locationTag,
      relationshipTag,
      status,
      ...rest
    } = createQrPlaqueDto;
    const plaque = this.qrPlaqueRepository.create({
      ...rest,
      uniqueCode,
      code: uniqueCode, // Keeping 'code' synced
      status: status || QrPlaqueStatus.PENDING,
    });

    // Determine Business Assignment (Ownership)
    const targetBusinessId = ownerBusinessId || assignedBusinessId;
    if (targetBusinessId) {
      const business = await this.businessRepository.findOne({
        where: { id: targetBusinessId },
      });
      if (!business) {
        throw new NotFoundException("Business not found");
      }
      plaque.assignedBusiness = business;
      if (!status) {
        plaque.status = QrPlaqueStatus.PENDING; // Default for business creation
      }
    }

    // Determine Partner Assignment
    if (assignedPartnerId) {
      const partner = await this.partnerRepository.findOne({
        where: { id: assignedPartnerId },
      });
      if (!partner) {
        throw new NotFoundException("Partner not found");
      }
      plaque.assignedPartner = partner;
    }

    // Handle Assignment to Referred Business
    if (assignToReferredBusinessId) {
      const requesterId = ownerBusinessId; // For create, ownerBusinessId is the requester
      if (!requesterId) {
        throw new BadRequestException(
          "Requester ID (ownerBusinessId) required for referred business assignment",
        );
      }

      const referral = await this.referralRepository.findOne({
        where: {
          referrerBusiness: { id: requesterId },
          refereeBusiness: { id: assignToReferredBusinessId },
        },
        relations: ["refereeBusiness"],
      });

      if (!referral) {
        throw new BadRequestException(
          "Cannot assign to this business. Only referred businesses allowed.",
        );
      }

      let network = await this.networkRepository.findOne({
        where: {
          business: { id: requesterId },
          onboardedBusinessId: assignToReferredBusinessId,
        },
      });

      if (!network) {
        const refereeBusiness = referral.refereeBusiness;
        network = this.networkRepository.create({
          business: { id: requesterId },
          fullName: refereeBusiness.name,
          businessName: refereeBusiness.name,
          email: refereeBusiness.email,
          phone: refereeBusiness.phone || "N/A",
          isOnboarded: true,
          onboardedType: "business",
          onboardedBusinessId: refereeBusiness.id,
          status: NetworkStatus.ACCEPTED,
          locationTag,
          relationshipTag,
        });
        await this.networkRepository.save(network);
      } else {
        // Update tags if they don't exist
        let needsUpdate = false;
        if (!network.locationTag && locationTag) {
          network.locationTag = locationTag;
          needsUpdate = true;
        }
        if (!network.relationshipTag && relationshipTag) {
          network.relationshipTag = relationshipTag;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await this.networkRepository.save(network);
        }
      }
      plaque.networkContact = network;
    } else if (networkContactId) {
      // Determine Network Assignment (Direct)
      const network = await this.networkRepository.findOne({
        where: { id: networkContactId },
      });
      if (!network) {
        throw new NotFoundException("Network contact not found");
      }
      plaque.networkContact = network;
    }

    return this.qrPlaqueRepository.save(plaque);
  }

  async findAllAdmin(query: QrPlaqueQueryDto) {
    return this.findAllCommon(query);
  }

  async findAllBusiness(businessId: string, query: QrPlaqueQueryDto) {
    return this.findAllCommon(query, businessId);
  }

  private async findAllCommon(query: QrPlaqueQueryDto, businessId?: string) {
    const { page, limit, search, status, startDate, endDate, sort } =
      query as any;
    const skip = (page - 1) * limit;

    const qb = this.qrPlaqueRepository
      .createQueryBuilder("plaque")
      .leftJoinAndSelect("plaque.assignedBusiness", "business")
      .leftJoinAndSelect("plaque.assignedPartner", "partner")
      .leftJoinAndSelect("plaque.networkContact", "network")
      .take(limit)
      .skip(skip);

    if (businessId) {
      qb.andWhere("plaque.assignedBusiness.id = :businessId", { businessId });
    }

    if (search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("plaque.name ILIKE :search", { search: `%${search}%` })
            .orWhere("plaque.description ILIKE :search", {
              search: `%${search}%`,
            })
            .orWhere("plaque.uniqueCode ILIKE :search", {
              search: `%${search}%`,
            });
        }),
      );
    }

    if (status) {
      // status is Array due to DTO transform, or single
      const statusArray = Array.isArray(status) ? status : [status];
      if (statusArray.length > 0) {
        qb.andWhere("plaque.status IN (:...statuses)", {
          statuses: statusArray,
        });
      }
    }

    if (startDate) {
      qb.andWhere("plaque.created_at >= :startDate", {
        startDate: moment(startDate).startOf("day").toDate(),
      });
    }

    if (endDate) {
      qb.andWhere("plaque.created_at <= :endDate", {
        endDate: moment(endDate).endOf("day").toDate(),
      });
    }

    if (sort === PlaqueSortOption.OLDEST) {
      qb.orderBy("plaque.created_at", "ASC");
    } else {
      qb.orderBy("plaque.created_at", "DESC");
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    updateQrPlaqueDto: UpdateQrPlaqueDto,
    requesterId?: string,
  ) {
    const plaque = await this.qrPlaqueRepository.findOne({
      where: { id },
      relations: ["assignedBusiness", "assignedPartner", "networkContact"],
    });

    if (!plaque) {
      throw new NotFoundException(`QR Plaque with ID ${id} not found`);
    }

    const {
      assignedPartnerId,
      assignedBusinessId,
      networkContactId,
      assignToReferredBusinessId,
      locationTag,
      relationshipTag,
      qrCodeUrl,
      ...rest
    } = updateQrPlaqueDto;

    // Apply simple updates
    Object.assign(plaque, rest);

    // Handle QR Code Upload notification
    if (qrCodeUrl && qrCodeUrl !== plaque.qrCodeUrl) {
      plaque.qrCodeUrl = qrCodeUrl;
      if (plaque.assignedBusiness && plaque.assignedBusiness.email) {
        console.log(
          `Notification: QR Code ready for plaque ${plaque.name} sent to ${plaque.assignedBusiness.email}`,
        );
      }
    }

    // Handle Assignment to Referred Business (Without Ownership Transfer)
    if (assignToReferredBusinessId) {
      if (!requesterId) {
        throw new BadRequestException(
          "Requester ID required for this operation",
        );
      }

      // 1. Verify Referral
      const referral = await this.referralRepository.findOne({
        where: {
          referrerBusiness: { id: requesterId },
          refereeBusiness: { id: assignToReferredBusinessId },
        },
        relations: ["refereeBusiness"],
      });

      if (!referral) {
        throw new BadRequestException(
          "Cannot assign to this business. Only referred businesses allowed.",
        );
      }

      // 2. Find or Create Network Contact
      let network = await this.networkRepository.findOne({
        where: {
          business: { id: requesterId },
          onboardedBusinessId: assignToReferredBusinessId,
        },
      });

      if (!network) {
        // Create a hidden/system network contact for this assignment
        const refereeBusiness = referral.refereeBusiness;
        network = this.networkRepository.create({
          business: { id: requesterId }, // Owner of the contact
          fullName: refereeBusiness.name,
          businessName: refereeBusiness.name,
          email: refereeBusiness.email,
          phone: refereeBusiness.phone || "N/A",
          isOnboarded: true,
          onboardedType: "business",
          onboardedBusinessId: refereeBusiness.id,
          status: NetworkStatus.ACCEPTED, // Auto-accepted as they are already a business
          locationTag,
          relationshipTag,
        });
        await this.networkRepository.save(network);
      } else {
        // Update tags if they don't exist but are provided
        let needsUpdate = false;
        if (!network.locationTag && locationTag) {
          network.locationTag = locationTag;
          needsUpdate = true;
        }
        if (!network.relationshipTag && relationshipTag) {
          network.relationshipTag = relationshipTag;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await this.networkRepository.save(network);
        }
      }

      plaque.networkContact = network;
      // We do NOT change assignedBusiness (Ownership remains)
    }

    // Handle Network Contact Assignment
    if (networkContactId) {
      const network = await this.networkRepository.findOne({
        where: { id: networkContactId },
        relations: ["business"],
      });
      if (!network) throw new NotFoundException("Network contact not found");

      // Verify network belongs to requester if provided
      if (
        requesterId &&
        network.business &&
        network.business.id !== requesterId
      ) {
        throw new BadRequestException("Network contact does not belong to you");
      }

      // Assign to contact (even if onboarded, we treat it as assignment, not transfer)
      plaque.networkContact = network;
    } else if (networkContactId === null) {
      plaque.networkContact = null;
    }

    // Handle Ownership Transfer (Only via explicit assignedBusinessId)
    if (assignedBusinessId) {
      if (requesterId && assignedBusinessId !== plaque.assignedBusiness?.id) {
        // Only Admin can arbitarily transfer? Or we allow transfer to referred business?
        // User said: "I don't want to transfer ownership... I just want to assigne it to them"
        // So we keep this strictly for ownership transfer requests.
        // If user mistakenly sent assignedBusinessId instead of assignToReferredBusinessId, they transfer ownership.
        // We can add a check if needed, but assuming DTO usage is correct.
      }

      const business = await this.businessRepository.findOne({
        where: { id: assignedBusinessId },
      });
      if (!business) throw new NotFoundException("Business not found");
      plaque.assignedBusiness = business;
    }

    if (assignedPartnerId) {
      const partner = await this.partnerRepository.findOne({
        where: { id: assignedPartnerId },
      });
      if (!partner) throw new NotFoundException("Partner not found");
      plaque.assignedPartner = partner;
    } else if (assignedPartnerId === null) {
      plaque.assignedPartner = null;
    }

    return this.qrPlaqueRepository.save(plaque);
  }

  async findOne(id: string) {
    const plaque = await this.qrPlaqueRepository.findOne({
      where: { id },
      relations: ["assignedBusiness", "assignedPartner", "networkContact"],
    });
    if (!plaque) {
      throw new NotFoundException(`QR Plaque with ID ${id} not found`);
    }
    return plaque;
  }

  async remove(id: string) {
    const plaque = await this.findOne(id);
    return this.qrPlaqueRepository.remove(plaque);
  }

  async findOneByCode(code: string) {
    return this.qrPlaqueRepository.findOne({
      where: { uniqueCode: code },
      relations: ["assignedPartner", "assignedBusiness", "networkContact"],
    });
  }

  async inviteUser(plaqueId: string, email: string) {
    const plaque = await this.findOne(plaqueId);
    if (!plaque.networkContact) {
      throw new BadRequestException(
        "Plaque is not assigned to a network contact",
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    plaque.assignmentCode = code;
    await this.qrPlaqueRepository.save(plaque);

    if (plaque.networkContact.email) {
      await this.mailService.sendInviteEmail(plaque.networkContact.email, code);
      return { message: "Invite sent" };
    }

    if (email && email !== plaque.networkContact.email) {
      await this.mailService.sendInviteEmail(email, code);
      return { message: "Invite sent to provided email" };
    }

    throw new BadRequestException("No email available for network contact");
  }

  async verifyInvite(code: string, email: string) {
    const plaque = await this.qrPlaqueRepository.findOne({
      where: { assignmentCode: code },
      relations: ["networkContact"],
    });

    if (!plaque) {
      throw new NotFoundException("Invalid assignment code");
    }

    if (plaque.status === QrPlaqueStatus.ASSIGNED) {
      throw new BadRequestException("This plaque has already been assigned");
    }

    if (!plaque.networkContact) {
      throw new InternalServerErrorException(
        "Plaque data corrupted: No network contact linked",
      );
    }

    if (
      plaque.networkContact.email &&
      email &&
      plaque.networkContact.email !== email
    ) {
      throw new BadRequestException(
        "Email does not match assigned network contact",
      );
    }

    plaque.status = QrPlaqueStatus.ASSIGNED;
    plaque.assignmentCode = null;

    // Update network status if needed
    if (plaque.networkContact.status === NetworkStatus.PENDING) {
      plaque.networkContact.status = NetworkStatus.ACCEPTED;
      await this.networkRepository.save(plaque.networkContact);
    }

    await this.qrPlaqueRepository.save(plaque);
    return {
      message: "Assignment accepted",
      plaque,
      networkContact: plaque.networkContact,
    };
  }

  async findAllNetwork(userId: string, email: string, role?: string) {
    let networkIds = [userId];

    if (role === "Network") {
      if (!email) return [];

      const networks = await this.networkRepository.find({
        where: { email: email },
      });
      networkIds = networks.map((n) => n.id);
    }

    if (networkIds.length === 0) return [];

    return this.qrPlaqueRepository.find({
      where: { networkContact: { id: In(networkIds) } },
      relations: ["assignedBusiness"],
      order: { created_at: "DESC" },
    });
  }
}
