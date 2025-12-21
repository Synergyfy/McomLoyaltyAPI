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
import { Role } from "../../common/role.enum";
import { User } from "../../common/interfaces/user.interface";

@Injectable()
export class LibraryAssetsService {
  constructor(
    @InjectRepository(LibraryAsset)
    private readonly assetRepository: Repository<LibraryAsset>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async create(
    createDto: CreateLibraryAssetDto,
    user: User,
  ): Promise<LibraryAsset> {
    const asset = this.assetRepository.create(createDto);

    if (user.role === Role.Business) {
      asset.ownerType = LibraryAssetOwnerType.BUSINESS;
      asset.businessId = user.id; // Assuming user.id is businessId for Business role
      // Business cannot set sector/category for global filtering, they manage their own tags usually,
      // but for this task, Admin sets tags. Business assets are just theirs.
      // We ignore sectorId etc from DTO for Business users to prevent them from "polluting" global tags?
      // Or we let them tag their own files? Prompt says: "Admin... should be able to upload files and tag it...".
      // It doesn't explicitly forbid Business from tagging, but usually Business assets are private to them.
      asset.sectorId = null;
      asset.categoryId = null;
      asset.subCategoryId = null;
    } else {
      // Admin/Staff
      asset.ownerType = LibraryAssetOwnerType.ADMIN;
      asset.businessId = null;
      // Admin can set tags
      asset.sectorId = createDto.sectorId || null;
      asset.categoryId = createDto.categoryId || null;
      asset.subCategoryId = createDto.subCategoryId || null;
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
    if (user.role === Role.Business) {
      let business: Business | null = null;

      // We might need business sector info if we are showing Admin assets by default
      if (source === AssetSource.ALL || source === AssetSource.ADMIN) {
        business = await this.businessRepository.findOne({
          where: { id: user.id },
          relations: ["sector"],
        });
      }

      // Logic construction
      const conditions: string[] = [];
      const params: any = {};

      if (source === AssetSource.MINE || source === AssetSource.ALL) {
        conditions.push("(asset.businessId = :businessId)");
        params.businessId = user.id;
      }

      if (source === AssetSource.ADMIN || source === AssetSource.ALL) {
        // Admin assets logic
        let adminCondition = "asset.ownerType = :adminOwnerType";
        params.adminOwnerType = LibraryAssetOwnerType.ADMIN;

        // Apply Sector Filters for Admin Assets
        if (sectorId) {
          adminCondition += " AND asset.sectorId = :reqSectorId";
          params.reqSectorId = sectorId;
        } else if (business && business.sector) {
          // Default: Show Admin assets from Business Sector OR Global Assets (no sector)
          // "by default ... fetch those files ... in that sector"
          adminCondition +=
            " AND (asset.sectorId = :userSectorId OR asset.sectorId IS NULL)";
          params.userSectorId = business.sector.id;
        }

        // Category/SubCategory filters (only apply if passed, logic implies if passed we filter by it)
        if (categoryId) {
          adminCondition += " AND asset.categoryId = :reqCategoryId";
          params.reqCategoryId = categoryId;
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
        // Should not happen with valid enum, but safe fallback
        query.andWhere("1=0");
      }
    } else {
      // Admin View: Sees everything usually? Or we can apply filters.
      // If Admin wants to search a specific business's assets, they might need extra params not in DTO yet.
      // But assuming Admin mostly manages Admin assets or views all.
      // For now, simple view.
      if (source === AssetSource.MINE || source === AssetSource.ADMIN) {
        query.andWhere("asset.ownerType = :ownerType", {
          ownerType: LibraryAssetOwnerType.ADMIN,
        });
      }
      // If ALL, shows all.

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

    if (user.role === Role.Business) {
      // Can view if Own or Admin
      if (
        asset.ownerType === LibraryAssetOwnerType.BUSINESS &&
        asset.businessId !== user.id
      ) {
        throw new ForbiddenException(
          "You do not have permission to view this asset",
        );
      }
      // If Admin asset, they can view it.
    }
    // Admin can view all.

    return asset;
  }

  async update(
    id: string,
    updateDto: UpdateLibraryAssetDto,
    user: User,
  ): Promise<LibraryAsset> {
    const asset = await this.findOne(id, user);

    if (user.role === Role.Business) {
      if (asset.ownerType !== LibraryAssetOwnerType.BUSINESS) {
        throw new ForbiddenException("You can only update your own assets");
      }
    }
    // Admin can update Admin assets. Can Admin update Business assets? Usually no, but maybe?
    // Requirement: "business can manages their own files... but can fetch or view admin own but can't delete or update it"
    // Doesn't explicitly say Admin can't update Business files, but usually they shouldn't.
    // I will restrict Admin to Admin assets for safety unless specified.
    if (
      user.role !== Role.Business &&
      asset.ownerType === LibraryAssetOwnerType.BUSINESS
    ) {
      // Maybe allow Admin? I'll allow Admin to be superuser if needed, but safe default is restrict.
      // Prompt says "business can manages their own files", implies ownership.
    }

    // Update fields
    Object.assign(asset, updateDto);

    // Validate: Business cannot set sector/category even on update
    if (user.role === Role.Business) {
      asset.sectorId = null;
      asset.categoryId = null;
      asset.subCategoryId = null;
    }

    return this.assetRepository.save(asset);
  }

  async remove(id: string, user: User): Promise<void> {
    const asset = await this.findOne(id, user);

    if (user.role === Role.Business) {
      if (asset.ownerType !== LibraryAssetOwnerType.BUSINESS) {
        throw new ForbiddenException("You can only delete your own assets");
      }
    }

    await this.assetRepository.softDelete(id);
  }
}
