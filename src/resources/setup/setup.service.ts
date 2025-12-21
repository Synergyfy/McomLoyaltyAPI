import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { BusinessReward } from "../rewards/entities/business-reward.entity";
import { BusinessCampaign } from "../campaign/entities/business-campaign.entity";
import { Staff } from "../staff/entities/staff.entity";
import { Tier } from "../tier/entities/tier.entity";
import { Reward } from "../rewards/entities/reward.entity";
import { Campaign } from "../campaign/entities/campaign.entity";
import { PointPackage } from "../point-package/entities/point-package.entity";
import { Role } from "../../common/role.enum";

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Tier)
    private readonly tierRepository: Repository<Tier>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(PointPackage)
    private readonly pointPackageRepository: Repository<PointPackage>,
  ) {}

  async getBusinessSetupStatus(userId: string, role: Role) {
    let businessId = userId;

    if (role === Role.Staff) {
      const staff = await this.staffRepository.findOne({
        where: { id: userId },
        relations: ["business"],
      });
      if (!staff || !staff.business) {
        throw new NotFoundException("Staff or associated business not found");
      }
      businessId = staff.business.id;
    }

    const [hasReward, hasCampaign, hasStaff] = await Promise.all([
      this.businessRewardRepository.count({
        where: { business: { id: businessId } },
      }),
      this.businessCampaignRepository.count({
        where: { business: { id: businessId } },
      }),
      this.staffRepository.count({ where: { business: { id: businessId } } }),
    ]);

    return {
      hasReward: hasReward > 0,
      hasCampaign: hasCampaign > 0,
      hasStaff: hasStaff > 0,
    };
  }

  async getAdminSetupStatus() {
    const [hasTiers, hasRewards, hasCampaigns, hasPointPackages] =
      await Promise.all([
        this.tierRepository.count(),
        this.rewardRepository.count(),
        this.campaignRepository.count({ where: { business: IsNull() } }),
        this.pointPackageRepository.count(),
      ]);

    return {
      hasTiers: hasTiers > 0,
      hasRewards: hasRewards > 0,
      hasCampaigns: hasCampaigns > 0,
      hasPointPackages: hasPointPackages > 0,
    };
  }
}
