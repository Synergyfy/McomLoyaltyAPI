import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Deal } from "./entities/deal.entity";
import { CreateDealDto } from "./dto/create-deal.dto";
import { User } from "../../common/interfaces/user.interface";
import { Role } from "../../common/role.enum";
import { DealStatus } from "./enums/deal-status.enum";
import { DealVisibility } from "./enums/deal-visibility.enum";
import { CategoryService } from "../category/category.service";
import { FilterDealDto } from "./dto/filter-deal.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { Campaign } from "../campaign/entities/campaign.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly categoryService: CategoryService,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
  ) { }

  async create(createDealDto: CreateDealDto, user: User) {
    const { categoryId, ...rest } = createDealDto;

    const category = await this.categoryService.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const deal = this.dealRepository.create({
      ...rest,
      category,
      business: user.role === Role.Business ? { id: user.id } : null,
      status:
        user.role === Role.Admin ? DealStatus.APPROVED : DealStatus.PENDING,
      isApproved: user.role === Role.Admin,
    });

    return this.dealRepository.save(deal);
  }

  async findAll(filterDealDto: FilterDealDto, user?: User) {
    const {
      limit,
      page,
      search,
      status,
      categoryId,
      location,
      minPrice,
      maxPrice,
      type,
    } = filterDealDto;
    const query = this.dealRepository.createQueryBuilder("deal");

    if (user) {
      if (user.role === Role.Business) {
        query.where("deal.businessId = :businessId", { businessId: user.id });
      }

      if (status) {
        query.andWhere("deal.status = :status", { status });
      }
    } else {
      // Logic for public users: only show active, approved, public deals
      query.where("deal.isActive = :isActive", { isActive: true });
      query.andWhere("deal.isApproved = :isApproved", { isApproved: true });
      query.andWhere("deal.visibility = :visibility", {
        visibility: DealVisibility.PUBLIC,
      });
    }

    if (categoryId) {
      query.andWhere("deal.categoryId = :categoryId", { categoryId });
    }

    if (search) {
      query.andWhere(
        "(deal.title ILIKE :search OR deal.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (location) {
      query.andWhere("deal.location ILIKE :location", {
        location: `%${location}%`,
      });
    }

    if (minPrice !== undefined) {
      query.andWhere("deal.dealPrice >= :minPrice", { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere("deal.dealPrice <= :maxPrice", { maxPrice });
    }

    if (type) {
      query.andWhere("deal.type = :type", { type });
    }

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [deals, total] = await query.getManyAndCount();
    return {
      data: deals,
      total,
      page,
      limit,
    };
  }

  async findAllAdmin(filterDealDto: FilterDealDto) {
    const {
      limit,
      page,
      search,
      status,
      categoryId,
      location,
      minPrice,
      maxPrice,
      type,
    } = filterDealDto;
    const query = this.dealRepository.createQueryBuilder("deal");

    query.leftJoinAndSelect("deal.business", "business");
    query.leftJoinAndSelect("business.sector", "sector");
    query.leftJoinAndSelect("deal.category", "category");

    if (status) {
      query.andWhere("deal.status = :status", { status });
    }

    if (categoryId) {
      query.andWhere("deal.categoryId = :categoryId", { categoryId });
    }

    if (search) {
      query.andWhere(
        "(deal.title ILIKE :search OR deal.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (location) {
      query.andWhere("deal.location ILIKE :location", {
        location: `%${location}%`,
      });
    }

    if (minPrice !== undefined) {
      query.andWhere("deal.dealPrice >= :minPrice", { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere("deal.dealPrice <= :maxPrice", { maxPrice });
    }

    if (type) {
      query.andWhere("deal.type = :type", { type });
    }

    query.orderBy("deal.created_at", "DESC");

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [deals, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: deals,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
        next: hasNext ? page + 1 : null,
        previous: hasPrevious ? page - 1 : null,
      },
    };
  }

  async findOne(id: string, user: User) {
    const query = this.dealRepository.createQueryBuilder("deal");
    query.leftJoinAndSelect("deal.business", "business");
    query.leftJoinAndSelect("business.sector", "sector");
    query.leftJoinAndSelect("deal.category", "category");
    query.where("deal.id = :id", { id });

    if (user.role === Role.Business) {
      query.andWhere("deal.businessId = :businessId", { businessId: user.id });
    }

    const deal = await query.getOne();
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto, user: User) {
    const { categoryId, ...rest } = updateDealDto;
    const deal = await this.findOne(id, user);

    if (categoryId) {
      const category = await this.categoryService.findOne(categoryId);
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }
      deal.category = category;
    }

    Object.assign(deal, rest);
    return this.dealRepository.save(deal);
  }

  async remove(id: string, user: User) {
    const deal = await this.findOne(id, user);
    await this.dealRepository.remove(deal);
    return { message: "Deal removed successfully" };
  }

  async updateStatus(id: string, status: DealStatus) {
    const deal = await this.dealRepository.findOne({ where: { id } });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
    deal.status = status;
    deal.isApproved = status === DealStatus.APPROVED;
    return this.dealRepository.save(deal);
  }

  async deactivate(id: string, isActive: boolean, user: User) {
    const deal = await this.findOne(id, user);
    deal.isActive = isActive;
    return this.dealRepository.save(deal);
  }

  async findAllPublic(filterDealDto: FilterDealDto) {
    const {
      limit,
      page,
      search,
      categoryId,
      location,
      minPrice,
      maxPrice,
      type,
    } = filterDealDto;
    const query = this.dealRepository.createQueryBuilder("deal");

    query.leftJoinAndSelect("deal.business", "business");
    query.leftJoinAndSelect("business.sector", "sector");
    query.leftJoinAndSelect("deal.category", "category");

    query.where("deal.isActive = :isActive", { isActive: true });
    query.andWhere("deal.isApproved = :isApproved", { isApproved: true });
    query.andWhere("deal.visibility = :visibility", {
      visibility: DealVisibility.PUBLIC,
    });

    if (categoryId) {
      query.andWhere("deal.categoryId = :categoryId", { categoryId });
    }

    if (search) {
      query.andWhere(
        "(deal.title ILIKE :search OR deal.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (location) {
      query.andWhere("deal.location ILIKE :location", {
        location: `%${location}%`,
      });
    }

    if (minPrice !== undefined) {
      query.andWhere("deal.dealPrice >= :minPrice", { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere("deal.dealPrice <= :maxPrice", { maxPrice });
    }

    if (type) {
      query.andWhere("deal.type = :type", { type });
    }

    query.orderBy("deal.isFeatured", "DESC");
    query.addOrderBy("deal.created_at", "DESC");

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [deals, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: deals,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
        next: hasNext ? page + 1 : null,
        previous: hasPrevious ? page - 1 : null,
      },
    };
  }

  async findOnePublic(id: string) {
    const query = this.dealRepository.createQueryBuilder("deal");
    query.leftJoinAndSelect("deal.business", "business");
    query.leftJoinAndSelect("business.sector", "sector");
    query.leftJoinAndSelect("deal.category", "category");
    query.leftJoinAndSelect("deal.reviews", "reviews");
    query.leftJoinAndSelect("reviews.user", "user");

    query.where("deal.id = :id", { id });
    query.andWhere("deal.isActive = :isActive", { isActive: true });
    query.andWhere("deal.isApproved = :isApproved", { isApproved: true });
    query.andWhere("deal.visibility = :visibility", {
      visibility: DealVisibility.PUBLIC,
    });

    const deal = await query.getOne();
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async findAllBusiness(filterDealDto: FilterDealDto, user: User) {
    const {
      limit,
      page,
      search,
      status,
      categoryId,
      location,
      minPrice,
      maxPrice,
      type,
    } = filterDealDto;
    const query = this.dealRepository.createQueryBuilder("deal");

    query.leftJoinAndSelect("deal.category", "category");

    query.where("deal.businessId = :businessId", { businessId: user.id });

    if (status) {
      query.andWhere("deal.status = :status", { status });
    }

    if (categoryId) {
      query.andWhere("deal.categoryId = :categoryId", { categoryId });
    }

    if (search) {
      query.andWhere(
        "(deal.title ILIKE :search OR deal.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (location) {
      query.andWhere("deal.location ILIKE :location", {
        location: `%${location}%`,
      });
    }

    if (minPrice !== undefined) {
      query.andWhere("deal.dealPrice >= :minPrice", { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere("deal.dealPrice <= :maxPrice", { maxPrice });
    }

    if (type) {
      query.andWhere("deal.type = :type", { type });
    }

    query.orderBy("deal.created_at", "DESC");

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [deals, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: deals,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
        next: hasNext ? page + 1 : null,
        previous: hasPrevious ? page - 1 : null,
      },
    };
  }

  async linkToCampaign(
    dealId: string,
    campaignId: string,
    type: "business" | "standard",
    user: User,
  ) {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId },
      relations: ["campaigns", "businessCampaigns", "business"],
    });
    if (!deal) throw new NotFoundException("Deal not found");

    if (user.role === Role.Business && deal.business.id !== user.id) {
      throw new NotFoundException("Deal not found"); // Hide existence
    }

    if (type === "standard") {
      const campaign = await this.campaignRepository.findOne({
        where: { id: campaignId },
        relations: ["business"],
      });
      if (!campaign) throw new NotFoundException("Campaign not found");

      // If business user, check if campaign belongs to them (if campaign has business)
      if (
        user.role === Role.Business &&
        campaign.business &&
        campaign.business.id !== user.id
      ) {
        throw new BadRequestException("You do not own this campaign");
      }

      if (!deal.campaigns.some((c) => c.id === campaignId)) {
        deal.campaigns.push(campaign);
        await this.dealRepository.save(deal);
      }
    } else {
      const businessCampaign = await this.businessCampaignRepository.findOne({
        where: { id: campaignId },
        relations: ["business"],
      });
      if (!businessCampaign)
        throw new NotFoundException("Business Campaign not found");

      if (
        user.role === Role.Business &&
        businessCampaign.business.id !== user.id
      ) {
        throw new BadRequestException("You do not own this campaign");
      }

      if (!deal.businessCampaigns.some((bc) => bc.id === campaignId)) {
        deal.businessCampaigns.push(businessCampaign);
        await this.dealRepository.save(deal);
      }
    }
    return { message: "Deal linked successfully" };
  }
}
