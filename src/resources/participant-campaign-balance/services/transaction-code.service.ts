import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { nanoid } from "nanoid";
import {
  TransactionCode,
  TransactionCodeStatus,
  TransactionType,
} from "../entities/transaction-code.entity";
import { GenerateCodeDto } from "../dto/generate-code.dto";
import { User } from "../../../common/interfaces/user.interface";
import { Role } from "../../../common/role.enum";
import { Staff } from "../../staff/entities/staff.entity";
import { Business } from "../../business/entities/business.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { Campaign } from "../../campaign/entities/campaign.entity";

@Injectable()
export class TransactionCodeService {
  constructor(
    @InjectRepository(TransactionCode)
    private readonly transactionCodeRepository: Repository<TransactionCode>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async generateCode(
    dto: GenerateCodeDto,
    user: User,
  ): Promise<TransactionCode> {
    if (dto.type === TransactionType.EARN && !dto.points) {
      throw new BadRequestException("Points are required for EARN type");
    }

    if (dto.type === TransactionType.REDEEM && !dto.rewardId) {
      throw new BadRequestException("Reward ID is required for REDEEM type");
    }

    const code = nanoid(9);

    const transactionCode = this.transactionCodeRepository.create({
      code,
      type: dto.type,
      points: dto.points,
      expires_at: new Date(dto.expiresAt),
      status: TransactionCodeStatus.ACTIVE,
      redemption_method: dto.redemptionMethod || "auto",
    });

    const businessCampaign = await this.businessCampaignRepository.findOne({
      where: { id: dto.campaignId },
    });

    if (!businessCampaign) {
      throw new BadRequestException("Business campaign not found");
    }

    transactionCode.businessCampaign = businessCampaign;

    if (dto.rewardId) {
      transactionCode.reward = { id: dto.rewardId } as any;
    }

    if (user.role === Role.Business) {
      transactionCode.creator_business = { id: user.id } as any;
    } else if (user.role === Role.Staff) {
      transactionCode.creator_staff = { id: user.id } as any;
    }

    return this.transactionCodeRepository.save(transactionCode);
  }

  async getGeneratedCodes(
    user: User,
    page: number,
    limit: number,
  ): Promise<{ data: TransactionCode[]; total: number }> {
    const where: any = {};

    if (user.role === Role.Business) {
      where.creator_business = { id: user.id };
    } else if (user.role === Role.Staff) {
      where.creator_staff = { id: user.id };
    }

    const [data, total] = await this.transactionCodeRepository.findAndCount({
      where,
      relations: ["used_by_participant"],
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async validateDualScanPermission(user: User, code: string): Promise<void> {
    if (user.role === Role.Business) {
      const business = await this.businessRepository.findOne({
        where: { id: user.id },
      });
      if (!business || business.uniqueCode !== code) {
        throw new ForbiddenException(
          "You can only use your own business unique code.",
        );
      }
    } else if (user.role === Role.Staff) {
      const staff = await this.staffRepository.findOne({
        where: { id: user.id },
        relations: ["business"],
      });
      if (!staff) {
        throw new NotFoundException("Staff not found");
      }
      // Staff can use their own code OR their business's code
      if (staff.uniqueCode !== code && staff.business.uniqueCode !== code) {
        throw new ForbiddenException(
          "You can only use your own staff code or your business code.",
        );
      }
    } else {
      throw new ForbiddenException("Unauthorized role for dual scan.");
    }
  }
}
