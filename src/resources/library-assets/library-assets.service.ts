import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import {
  LibraryAsset,
  LibraryAssetOwnerType,
} from "./entities/library-asset.entity";
import { CreateLibraryAssetDto } from "./dto/create-library-asset.dto";
import { UpdateLibraryAssetDto } from "./dto/update-library-asset.dto";
import {
  SearchLibraryAssetDto,
  AssetSource,
} from "./dto/search-library-asset.dto";
import { PageDto } from "../../common/dto/page.dto";
import { Business } from "../business/entities/business.entity";
import { Staff } from "../staff/entities/staff.entity";
import { Role } from "../../common/role.enum";
import { User } from "../../common/interfaces/user.interface";

@Injectable()
export class LibraryAssetsService {
  constructor(
    @InjectRepository(LibraryAsset)
    private readonly assetRepository: Repository<LibraryAsset>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async create(
    createDto: CreateLibraryAssetDto,
    user: User,
  ): Promise<LibraryAsset> {
    const asset = this.assetRepository.create(createDto);

    if (user.role === Role.Business) {
      asset.ownerType = LibraryAssetOwnerType.BUSINESS;
      asset.businessId = user.id;
      // Business assets are private; clear sector/category
      asset.sectorId = null;
      asset.categoryId = null;
      asset.subCategoryId = null;
    } else if (user.role === Role.Admin) {
      asset.ownerType = LibraryAssetOwnerType.ADMIN;
      asset.businessId = null; // Admin assets don't have a businessId
      // Admin sets tags for global/sector-based distribution
      asset.sectorId = createDto.sectorId || null;
      asset.categoryId = createDto.categoryId || null;
      asset.subCategoryId = createDto.subCategoryId || null;
    } else {
      throw new ForbiddenException("Only Business and Admin can upload assets");
    }

    return this.assetRepository.save(asset);
  }

  async findAll(
    searchDto: SearchLibraryAssetDto,
    user: User,
  ): Promise<PageDto<LibraryAsset>> {
    const {
      page,
      limit,
      search,
      type,
      sectorId,
      categoryId,
      subCategoryId,
      source,
    } = searchDto;
    const skip = (page - 1) * limit;

    const query = this.assetRepository
      .createQueryBuilder("asset")
      .leftJoinAndSelect("asset.sector", "sector")
      .leftJoinAndSelect("asset.category", "category")
      .leftJoinAndSelect("asset.subCategory", "subCategory");

    // Filter by Type
    if (type) {
      query.andWhere("asset.type = :type", { type });
    }

    // Filter by Search (Title or Description)
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where("asset.title ILIKE :search", {
            search: `%${search}%`,
          }).orWhere("asset.description ILIKE :search", {
            search: `%${search}%`,
          });
        }),
      );
    }

    // Access Control Logic
    if (user.role === Role.Business || user.role === Role.Staff) {
      let business: Business | null = null;
      let targetBusinessId: string = user.id;

      if (user.role === Role.Staff) {
        const staff = await this.staffRepository.findOne({
          where: { id: user.id },
          relations: ["business"],
        });
        if (!staff || !staff.business) {
          throw new ForbiddenException("Staff must belong to a business");
        }
        targetBusinessId = staff.business.id;
      }

      // Always fetch business info for sector/category matching of Admin assets
      business = await this.businessRepository.findOne({
        where: { id: targetBusinessId },
        relations: ["sector", "category"],
      });

      // Logic construction
      const conditions: string[] = [];
      const params: any = {};

      if (source === AssetSource.MINE || source === AssetSource.ALL) {
        conditions.push("(asset.businessId = :businessId)");
        params.businessId = targetBusinessId;
      }

      if (source === AssetSource.ADMIN || source === AssetSource.ALL) {
        // Admin assets logic: Must match BOTH sector AND category if they exist on the business
        let adminCondition = "asset.ownerType = :adminOwnerType";
        params.adminOwnerType = LibraryAssetOwnerType.ADMIN;

        // Apply Sector Filters for Admin Assets
        if (sectorId) {
          adminCondition += " AND asset.sectorId = :reqSectorId";
          params.reqSectorId = sectorId;
        } else if (business && business.sector) {
          adminCondition +=
            " AND (asset.sectorId = :userSectorId OR asset.sectorId IS NULL)";
          params.userSectorId = business.sector.id;
        }

        // Apply Category Filters for Admin Assets
        if (categoryId) {
          adminCondition += " AND asset.categoryId = :reqCategoryId";
          params.reqCategoryId = categoryId;
        } else if (business && business.category) {
          adminCondition +=
            " AND (asset.categoryId = :userCategoryId OR asset.categoryId IS NULL)";
          params.userCategoryId = business.category.id;
        }

        if (subCategoryId) {
          adminCondition += " AND asset.subCategoryId = :reqSubCategoryId";
          params.reqSubCategoryId = subCategoryId;
        }

        conditions.push(`(${adminCondition})`);
      }

      if (conditions.length > 0) {
        query.andWhere(
          new Brackets((qb) => {
            conditions.forEach((cond, index) => {
              if (index === 0) qb.where(cond, params);
              else qb.orWhere(cond, params);
            });
          }),
        );
      } else {
        query.andWhere("1=0");
      }
    } else {
      // Admin View: Sees all admin-uploaded assets.
      query.andWhere("asset.ownerType = :adminOwnerType", {
        adminOwnerType: LibraryAssetOwnerType.ADMIN,
      });

      // Apply filters if present
      if (sectorId) query.andWhere("asset.sectorId = :sectorId", { sectorId });
      if (categoryId)
        query.andWhere("asset.categoryId = :categoryId", { categoryId });
      if (subCategoryId)
        query.andWhere("asset.subCategoryId = :subCategoryId", {
          subCategoryId,
        });
    }

    query.orderBy("asset.created_at", "DESC");
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      next: page * limit < total ? page + 1 : null,
      previous: page > 1 ? page - 1 : null,
    };
  }

  async findOne(id: string, user: User): Promise<LibraryAsset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: ["sector", "category", "subCategory"],
    });

    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    if (user.role === Role.Business || user.role === Role.Staff) {
      let targetBusinessId = user.id;
      if (user.role === Role.Staff) {
        const staff = await this.staffRepository.findOne({
          where: { id: user.id },
          relations: ["business"],
        });
        if (staff && staff.business) {
          targetBusinessId = staff.business.id;
        }
      }

      // Can view if Own Business asset or Admin asset
      if (
        asset.ownerType === LibraryAssetOwnerType.BUSINESS &&
        asset.businessId !== targetBusinessId
      ) {
        throw new ForbiddenException(
          "You do not have permission to view this asset",
        );
      }
    } else {
      // Admin: Can view any admin asset
      if (asset.ownerType !== LibraryAssetOwnerType.ADMIN) {
        throw new ForbiddenException(
          "You do not have permission to view this asset",
        );
      }
    }

    return asset;
  }

  async update(
    id: string,
    updateDto: UpdateLibraryAssetDto,
    user: User,
  ): Promise<LibraryAsset> {
    const asset = await this.findOne(id, user);

    if (user.role === Role.Business || user.role === Role.Staff) {
      if (asset.ownerType !== LibraryAssetOwnerType.BUSINESS) {
        throw new ForbiddenException("You can only update your own assets");
      }
      let targetBusinessId = user.id;
      if (user.role === Role.Staff) {
        const staff = await this.staffRepository.findOne({
          where: { id: user.id },
          relations: ["business"],
        });
        if (staff && staff.business) {
          targetBusinessId = staff.business.id;
        }
      }
      if (asset.businessId !== targetBusinessId) {
        throw new ForbiddenException(
          "You can only update your own business assets",
        );
      }
    } else {
      // Admin: Can update any admin asset
      if (asset.ownerType !== LibraryAssetOwnerType.ADMIN) {
        throw new ForbiddenException("You can only update admin assets");
      }
    }

    // Update fields
    Object.assign(asset, updateDto);

    // Validate: Business / Staff cannot set sector/category even on update
    if (user.role === Role.Business || user.role === Role.Staff) {
      asset.sectorId = null;
      asset.categoryId = null;
      asset.subCategoryId = null;
    }

    return this.assetRepository.save(asset);
  }

  async remove(id: string, user: User): Promise<void> {
    const asset = await this.findOne(id, user);

    if (user.role === Role.Business || user.role === Role.Staff) {
      if (asset.ownerType !== LibraryAssetOwnerType.BUSINESS) {
        throw new ForbiddenException("You can only delete your own assets");
      }
    } else {
      // Admin: Can delete any admin asset
      if (asset.ownerType !== LibraryAssetOwnerType.ADMIN) {
        throw new ForbiddenException("You can only delete admin assets");
      }
    }

    await this.assetRepository.softDelete(id);
  }
}
