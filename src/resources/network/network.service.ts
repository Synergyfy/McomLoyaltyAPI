import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Network } from "./entities/network.entity";
import { CreateNetworkDto } from "./dto/create-network.dto";
import { Business } from "../business/entities/business.entity";
import { BulkImportNetworkDto } from "./dto/bulk-import-network.dto";
import { GetNetworkDto } from "./dto/get-network.dto";
import { UpdateNetworkDto } from "./dto/update-network.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import {
  NetworkOnboardingDto,
  OnboardingType,
} from "./dto/network-onboarding.dto";
import { TagNetworkDto } from "./dto/tag-network.dto";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../common/enums/network-tags.enum";
import { HashService } from "../../common/hash/hash.service";
import { Partner } from "../partner/entities/partner.entity";
import { Sector } from "../sector/entities/sector.entity";
import { Category } from "../category/entities/category.entity";
import { SubCategory } from "../subcategory/entities/subcategory.entity";
import { Tier } from "../tier/entities/tier.entity";
import {
  Membership,
  MembershipStatus,
  PlanType,
} from "../membership/entities/membership.entity";
import { Role } from "../../common/role.enum";
import { nanoid } from "nanoid";

@Injectable()
export class NetworkService {
  constructor(
    @InjectRepository(Network)
    private readonly networkRepository: Repository<Network>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly hashService: HashService,
  ) {}

  async getOnboardingDetails(id: string) {
    const network = await this.networkRepository.findOne({ where: { id } });
    if (!network) {
      throw new NotFoundException(`Network contact with ID ${id} not found`);
    }
    if (network.isOnboarded) {
      throw new BadRequestException("This contact has already onboarded");
    }

    return {
      fullName: network.fullName,
      email: network.email,
      phone: network.phone,
      businessName: network.businessName,
    };
  }

  async onboard(id: string, dto: NetworkOnboardingDto) {
    const network = await this.networkRepository.findOne({
      where: { id },
      relations: ["business"], // The business that owns this contact
    });

    if (!network) {
      throw new NotFoundException(`Network contact with ID ${id} not found`);
    }

    if (network.isOnboarded) {
      throw new BadRequestException("This contact has already onboarded");
    }

    const hashedPassword = await this.hashService.hashPassword(dto.password);

    const sector = await this.sectorRepository.findOne({
      where: { id: dto.sectorId },
    });
    if (!sector) throw new NotFoundException("Sector not found");

    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException("Category not found");

    const subCategory = await this.subCategoryRepository.findOne({
      where: { id: dto.subCategoryId },
    });
    if (!subCategory) throw new NotFoundException("Sub-category not found");

    let createdEntityId: string;

    if (dto.type === OnboardingType.BUSINESS) {
      // Check if email already exists in businesses
      const existingBusiness = await this.businessRepository.findOne({
        where: { email: network.email },
      });
      if (existingBusiness) {
        throw new ConflictException(
          "A business with this email already exists",
        );
      }

      const uniqueCode = nanoid(9);
      const affiliateCode = Math.random().toString(36).substring(2, 11);

      const business = this.businessRepository.create({
        name: network.businessName || network.fullName,
        email: network.email,
        password: hashedPassword,
        phone: dto.phone || network.phone,
        address: dto.address,
        postalCode: dto.postalCode,
        sector,
        category,
        subCategory,
        uniqueCode,
        affiliateCode,
        role: Role.Business,
      });

      const savedBusiness = await this.businessRepository.save(business);
      createdEntityId = savedBusiness.id;

      network.onboardedBusinessId = savedBusiness.id;
    } else {
      // Check if email already exists in partners
      const existingPartner = await this.partnerRepository.findOne({
        where: { email: network.email },
      });
      if (existingPartner) {
        throw new ConflictException("A partner with this email already exists");
      }

      const partner = this.partnerRepository.create({
        name: network.fullName,
        businessName: network.businessName || network.fullName,
        email: network.email,
        phoneNumber: dto.phone || network.phone,
        password: hashedPassword,
        sector,
        category,
        subCategory,
      });

      const savedPartner = await this.partnerRepository.save(partner);
      createdEntityId = savedPartner.id;
      network.onboardedPartnerId = savedPartner.id;
    }

    network.isOnboarded = true;
    network.onboardedType = dto.type;
    await this.networkRepository.save(network);

    return {
      success: true,
      message: `Successfully onboarded as ${dto.type}`,
      id: createdEntityId,
    };
  }

  async addNetwork(createNetworkDto: CreateNetworkDto, business: Business) {
    const { email, phone } = createNetworkDto;

    // Check for duplicates
    const existing = await this.networkRepository
      .createQueryBuilder("network")
      .where("network.businessId = :businessId", { businessId: business.id })
      .andWhere("(network.email = :email OR network.phone = :phone)", {
        email: email || "",
        phone,
      })
      .getOne();

    if (existing) {
      if (email && existing.email === email) {
        throw new ConflictException(
          `Network contact with email ${email} already exists in your network.`,
        );
      }
      if (existing.phone === phone) {
        throw new ConflictException(
          `Network contact with phone ${phone} already exists in your network.`,
        );
      }
    }

    try {
      const network = this.networkRepository.create({
        ...createNetworkDto,
        hasSharingPermission: createNetworkDto.hasPermission,
        business,
      });
      return await this.networkRepository.save(network);
    } catch (error) {
      // Catch duplicate error if race condition occurs
      if (error.code === "23505") {
        // Postgres unique violation code
        throw new ConflictException("Network contact already exists.");
      }
      throw new InternalServerErrorException("Failed to add network contact");
    }
  }

  async bulkImport(bulkImportDto: BulkImportNetworkDto, business: Business) {
    const { networks } = bulkImportDto;
    if (!networks.length)
      return { message: "No contacts provided for import." };

    const emails = networks.map((n) => n.email).filter(Boolean);
    const phones = networks.map((n) => n.phone);

    // Fetch existing contacts for this business to check duplicates
    // Using simple query builder to get all potentially conflicting entries
    const existingContacts = await this.networkRepository
      .createQueryBuilder("network")
      .where("network.businessId = :businessId", { businessId: business.id })
      .andWhere(
        "(network.email IN (:...emails) OR network.phone IN (:...phones))",
        {
          emails: emails.length ? emails : [""],
          phones: phones.length ? phones : [""],
        },
      )
      .getMany();

    const existingEmails = new Set(
      existingContacts.map((c) => c.email).filter(Boolean),
    );
    const existingPhones = new Set(existingContacts.map((c) => c.phone));

    const toInsert = [];
    const errors = [];

    // Set to track duplicates within the payload itself
    const payloadEmails = new Set();
    const payloadPhones = new Set();

    for (const contact of networks) {
      let error = null;
      if (contact.email) {
        if (existingEmails.has(contact.email))
          error = `Email ${contact.email} already exists`;
        else if (payloadEmails.has(contact.email))
          error = `Duplicate email ${contact.email} in import list`;
      }

      if (!error && existingPhones.has(contact.phone))
        error = `Phone ${contact.phone} already exists`;
      if (!error && payloadPhones.has(contact.phone))
        error = `Duplicate phone ${contact.phone} in import list`;

      if (error) {
        errors.push({ ...contact, error });
      } else {
        if (contact.email) payloadEmails.add(contact.email);
        payloadPhones.add(contact.phone);

        toInsert.push(
          this.networkRepository.create({
            ...contact,
            hasSharingPermission:
              bulkImportDto.hasPermission ?? contact.hasPermission,
            business,
          }),
        );
      }
    }

    if (toInsert.length > 0) {
      // "send a query at once" - simple insert is much faster than save for bulk
      // Using chunking if array is massive, but TypeORM handles reasonably sized arrays well.
      // Insert ignores listeners/hooks but is faster. If hooks needed, use save.
      await this.networkRepository.insert(toInsert);
    }

    return {
      message: `Imported ${toInsert.length} contacts. ${errors.length} failed.`,
      importedCount: toInsert.length,
      failedCount: errors.length,
      errors: errors, // Return specific errors for failed items
    };
  }

  async findAll(query: GetNetworkDto, businessId?: string) {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    const filterBusinessId = businessId || query.businessId;

    const qb = this.networkRepository.createQueryBuilder("network");

    if (filterBusinessId) {
      qb.where("network.businessId = :businessId", {
        businessId: filterBusinessId,
      });
    }

    if (search) {
      qb.andWhere(
        "(network.fullName ILIKE :search OR network.email ILIKE :search OR network.phone ILIKE :search OR network.businessName ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere("network.status = :status", { status });
    }

    // Exclude customers from general findAll
    qb.andWhere("(network.relationshipTag IS DISTINCT FROM :customerTag)", {
      customerTag: NetworkRelationshipTag.CUSTOMER,
    });

    const sortMapping: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    const sortField = sortMapping[sortBy] || sortBy;

    qb.orderBy(`network.${sortField}`, sortOrder as "ASC" | "DESC");

    // Pagination logic
    const skip = (page - 1) * limit;
    const [data, total] = await qb.take(limit).skip(skip).getManyAndCount();

    const lastPage = Math.ceil(total / limit);
    const nextPage = page < lastPage ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        nextPage,
        prevPage,
      },
    };
  }

  async addCustomer(createNetworkDto: CreateNetworkDto, business: Business) {
    // Force relationship tag to CUSTOMER
    const customerDto = {
      ...createNetworkDto,
      relationshipTag: NetworkRelationshipTag.CUSTOMER,
    };
    return this.addNetwork(customerDto, business);
  }

  async findAllCustomers(query: GetNetworkDto, businessId?: string) {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    const filterBusinessId = businessId || query.businessId;

    const qb = this.networkRepository.createQueryBuilder("network");

    if (filterBusinessId) {
      qb.where("network.businessId = :businessId", {
        businessId: filterBusinessId,
      });
    }

    // Filter ONLY customers
    qb.andWhere("network.relationshipTag = :customerTag", {
      customerTag: NetworkRelationshipTag.CUSTOMER,
    });

    if (search) {
      qb.andWhere(
        "(network.fullName ILIKE :search OR network.email ILIKE :search OR network.phone ILIKE :search OR network.businessName ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere("network.status = :status", { status });
    }

    const sortMapping: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    const sortField = sortMapping[sortBy] || sortBy;

    qb.orderBy(`network.${sortField}`, sortOrder as "ASC" | "DESC");

    const skip = (page - 1) * limit;
    const [data, total] = await qb.take(limit).skip(skip).getManyAndCount();

    const lastPage = Math.ceil(total / limit);
    const nextPage = page < lastPage ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        nextPage,
        prevPage,
      },
    };
  }

  async bulkImportCustomers(
    bulkImportDto: BulkImportNetworkDto,
    business: Business,
  ) {
    // Tag all incoming networks as CUSTOMER
    const networks = bulkImportDto.networks.map((n) => ({
      ...n,
      relationshipTag: NetworkRelationshipTag.CUSTOMER,
    }));

    return this.bulkImport({ ...bulkImportDto, networks }, business);
  }

  async update(
    id: string,
    updateNetworkDto: UpdateNetworkDto,
    business: Business,
  ) {
    const network = await this.findOne(id, business.id);

    Object.assign(network, {
      ...updateNetworkDto,
      hasSharingPermission:
        updateNetworkDto.hasPermission ?? network.hasSharingPermission,
    });

    return await this.networkRepository.save(network);
  }

  async remove(id: string, business: Business) {
    const network = await this.findOne(id, business.id);
    return await this.networkRepository.softRemove(network);
  }

  async findOne(id: string, businessId: string) {
    const network = await this.networkRepository.findOne({
      where: { id, business: { id: businessId } },
    });

    if (!network) {
      throw new NotFoundException(`Network contact with ID ${id} not found`);
    }

    return network;
  }

  async tagReferredBusiness(
    referredBusinessId: string,
    tagNetworkDto: TagNetworkDto,
    referrer: Business,
  ) {
    const business = await this.businessRepository.findOne({
      where: {
        id: referredBusinessId,
        referredBy: { id: referrer.id },
      },
    });

    if (!business) {
      throw new NotFoundException(
        `No referred business found with ID ${referredBusinessId}`,
      );
    }

    Object.assign(business, tagNetworkDto);
    return await this.businessRepository.save(business);
  }
}
