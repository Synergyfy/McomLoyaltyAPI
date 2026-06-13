import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual } from "typeorm";
import { nanoid } from "nanoid";
import { Business } from "../entities/business.entity";
import {
  Referral,
  ReferralStatus,
} from "../../referral/entities/referral.entity";
import { BusinessCampaign } from "../../campaign/entities/business-campaign.entity";
import { BusinessReward } from "../../rewards/entities/business-reward.entity";
import { Staff } from "../../staff/entities/staff.entity";
import { Network } from "../../network/entities/network.entity";
import {
  NetworkLocationTag,
  NetworkRelationshipTag,
} from "../../../common/enums/network-tags.enum";
import { RewardStatus } from "../../rewards/enums/reward-status.enum";
import { ReferralService } from "../../referral/referral.service";
import { CreateBusinessDto } from "../dto/create-business.dto";
import { UpdateBusinessDto } from "../dto/update-business.dto";
import { UpdateBusinessProfileDto } from "../dto/update-business-profile.dto";
import { OnboardingDto } from "../dto/onboarding.dto";
import { HashService } from "../../../common/hash/hash.service";
import { SectorService } from "../../sector/services/sector.service";
import { CategoryService } from "../../category/category.service";
import { SubcategoryService } from "../../subcategory/subcategory.service";
import { PaginationResult } from "../../../common/interfaces/pagination-result.interface";
import { PaymentHistoryService } from "../../payment-history/payment-history.service";
import {
  PointHistory,
  PointHistoryType,
} from "../../participant-campaign-balance/entities/point-history.entity";
import { SystemSettingService } from "../../system-setting/services/system-setting.service";
import { PaymentService } from "../../payment/payment.service";
import { MatchingPointService } from "../../matching-point/services/matching-point.service";
import { MatchingPointActivityType } from "../../matching-point/entities/matching-point-config.entity";

import { OtpService } from "../../otp/otp.service";
import { MailService } from "../../../mail/mail.service";
import { WalletService } from "../../wallet/wallet.service";
import { StampPackageService } from "../../stamp/services/stamp-package.service";
import { ProvisionService } from "../../provision/provision.service";
import { ProvisionType } from "../../provision/entities/provision.entity";
import { MembershipService } from "../../membership/membership.service";

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    private readonly hashService: HashService,
    private readonly sectorService: SectorService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly paymentHistoryService: PaymentHistoryService,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly systemSettingService: SystemSettingService,
    @InjectRepository(BusinessCampaign)
    private readonly businessCampaignRepository: Repository<BusinessCampaign>,
    @InjectRepository(BusinessReward)
    private readonly businessRewardRepository: Repository<BusinessReward>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Network)
    private readonly networkRepository: Repository<Network>,
    private readonly paymentService: PaymentService,
    private readonly matchingPointService: MatchingPointService,
    private readonly referralService: ReferralService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly walletService: WalletService,
    private readonly stampPackageService: StampPackageService,
    private readonly provisionService: ProvisionService,
    private readonly membershipService: MembershipService,
  ) { }

  private async generateAffiliateCode(): Promise<string> {
    let affiliateCode: string;
    let isUnique = false;
    while (!isUnique) {
      affiliateCode = Math.random().toString(36).substring(2, 11);
      const existingBusiness = await this.findByAffiliateCode(affiliateCode);
      if (!existingBusiness) {
        isUnique = true;
      }
    }
    return affiliateCode;
  }

  async create(
    createBusinessDto: CreateBusinessDto,
    isSuperBusiness: boolean = false,
  ): Promise<Business> {
    const existingBusiness = await this.findByEmail(createBusinessDto.email);
    if (existingBusiness) {
      throw new ConflictException("Email already exists");
    }

    if (createBusinessDto.provisionCode) {
      const provision = await this.provisionService.findByCode(createBusinessDto.provisionCode);
      if (!provision) throw new BadRequestException("Invalid provision code");
      if (provision.isRedeemed) throw new BadRequestException("Provision code already redeemed");
      if (new Date() > provision.expiresAt) throw new BadRequestException("Provision code expired");
    }

    const hashedPassword = await this.hashService.hashPassword(
      createBusinessDto.password,
    );
    const { confirmPassword, referralCode, provisionCode, ...rest } = createBusinessDto;

    let referrer: Business;
    if (referralCode) {
      referrer = await this.findByAffiliateCode(referralCode);
      if (!referrer) {
        throw new BadRequestException("Invalid referral code");
      }
    }

    // Use nanoid(9) for consistency with other entities
    const uniqueCode = nanoid(9);
    const affiliateCode = await this.generateAffiliateCode();

    const business = this.businessRepository.create({
      ...rest,
      password: hashedPassword,
      uniqueCode,
      affiliateCode,
      referredBy: referrer,
      relationshipTag: referrer ? NetworkRelationshipTag.AFFILIATE : null,
      isSuperBusiness,
    });
    const newBusiness = await this.businessRepository.save(business);

    // Create Business Wallet
    await this.walletService.createWallet(newBusiness);

    // Handle Provision Code
    if (provisionCode) {
      try {
        const provision = await this.provisionService.validateAndMarkRedeemed(provisionCode, newBusiness.id);
        if (provision.type === ProvisionType.TIER_ACCESS) {
          const { tierId, durationDays } = provision.payload;
          await this.membershipService.grantAccess(newBusiness.id, tierId, durationDays, 'PROVISION');
        }
      } catch (e) {
        console.error("Failed to redeem provision code for new business", e);
        // Swallow error to not break sign up flow, but user won't get reward.
        // In a real system we might retry or alert support.
      }
    }

    if (referrer) {
      // Create Business-to-Business Referral
      const referral = this.referralRepository.create({
        referrerBusiness: referrer,
        refereeBusiness: newBusiness,
        status: ReferralStatus.PENDING,
        // code can be referrer's affiliate code for tracking context
        code: referrer.affiliateCode || "system",
        refereeEmail: newBusiness.email,
      });
      await this.referralRepository.save(referral);

      // Search for an existing Network contact under the referrer with the same email
      const existingNetworkContact = await this.networkRepository.findOne({
        where: {
          business: { id: referrer.id },
          email: newBusiness.email,
        },
      });

      if (existingNetworkContact) {
        existingNetworkContact.relationshipTag =
          NetworkRelationshipTag.AFFILIATE;
        existingNetworkContact.onboardedBusinessId = newBusiness.id;
        existingNetworkContact.isOnboarded = true;
        existingNetworkContact.onboardedType = "business";
        await this.networkRepository.save(existingNetworkContact);
      }
    }

    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpService.create(newBusiness.email, otp);
    try {
      await this.mailService.sendOtp(newBusiness.email, otp);
    } catch (mailError) {
      console.error(`Failed to send signup OTP email to ${newBusiness.email}:`, mailError);
      newBusiness.otp = otp;
    }

    return newBusiness;
  }

  async onboarding(
    id: string,
    onboardingDto: OnboardingDto,
  ): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const { sectorId, categoryId, subCategoryId, referralCapacity, ...rest } =
      onboardingDto;

    // Transform referralCapacity: "12+" -> 12
    const transformedReferralCapacity = referralCapacity
      ? parseInt(referralCapacity.replace("+", ""), 10)
      : null;

    const sector = await this.sectorService.findOne(sectorId);
    if (!sector) {
      throw new NotFoundException("Sector not found");
    }

    let category = null;
    if (categoryId) {
      category = await this.categoryService.findOne(categoryId);
      if (!category) {
        throw new NotFoundException("Category not found");
      }
      if (category.sector.id !== sectorId) {
        throw new ConflictException(
          "Category does not belong to the selected sector",
        );
      }
    }

    let subCategory = null;
    if (subCategoryId) {
      subCategory = await this.subcategoryService.findOne(subCategoryId);
      if (!subCategory) {
        throw new NotFoundException("Subcategory not found");
      }
      if (subCategory.category.id !== categoryId) {
        throw new ConflictException(
          "Subcategory does not belong to the selected category",
        );
      }
    }

    const updatedBusiness = {
      ...business,
      ...rest,
      sector,
      category,
      subCategory,
      referralCapacity: transformedReferralCapacity,
    };

    const savedBusiness = await this.businessRepository.save(updatedBusiness);

    return savedBusiness;
  }

  async findByEmail(email: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { email } });
  }

  async findByUniqueCode(uniqueCode: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { uniqueCode } });
  }

  async findByAffiliateCode(
    affiliateCode: string,
  ): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { affiliateCode } });
  }

  async getAffiliateCode(id: string): Promise<string> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException("Business not found");
    }
    if (business.affiliateCode) {
      return business.affiliateCode;
    }
    const affiliateCode = await this.generateAffiliateCode();
    await this.businessRepository.update(id, { affiliateCode });
    return affiliateCode;
  }

  async findById(
    id: string,
    relations: string[] = [],
  ): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { id }, relations });
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginationResult<Business>> {
    const [data, total] = await this.businessRepository.findAndCount({
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["sector", "category", "subCategory"],
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async findAllSuperBusinesses(
    page: number,
    limit: number,
  ): Promise<PaginationResult<Business>> {
    const [data, total] = await this.businessRepository.findAndCount({
      where: { isSuperBusiness: true },
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["sector", "category", "subCategory"],
    });

    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    if (updateBusinessDto.email) {
      const existingBusiness = await this.findByEmail(updateBusinessDto.email);
      if (existingBusiness && existingBusiness.id !== id) {
        throw new ConflictException("Email already exists");
      }
    }

    const business = await this.findById(id, [
      "sector",
      "category",
      "subCategory",
    ]);
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const {
      sector: sectorId,
      category: categoryId,
      subCategory: subCategoryId,
      ...rest
    } = updateBusinessDto;

    let sector = business.sector;
    let category = business.category;
    let subCategory = business.subCategory;

    if (sectorId) {
      sector = await this.sectorService.findOne(sectorId);
      if (!sector) throw new NotFoundException("Sector not found");
    }

    if (categoryId) {
      category = await this.categoryService.findOne(categoryId);
      if (!category) throw new NotFoundException("Category not found");
      // If sector is changing or already exists, validation must match
      if (sector && category.sector && category.sector.id !== sector.id) {
        throw new BadRequestException(
          "Category does not belong to the selected Sector",
        );
      }
    }

    if (subCategoryId) {
      subCategory = await this.subcategoryService.findOne(subCategoryId);
      if (!subCategory) throw new NotFoundException("SubCategory not found");
      // If category is changing or already exists, validation must match
      if (
        category &&
        subCategory.category &&
        subCategory.category.id !== category.id
      ) {
        throw new BadRequestException(
          "SubCategory does not belong to the selected Category",
        );
      }
    }

    // Construct update object with explicit relations
    const updates: any = { ...rest };
    if (sectorId) updates.sector = sector;
    if (categoryId) updates.category = category;
    if (subCategoryId) updates.subCategory = subCategory;

    const updatedBusiness = this.businessRepository.merge(business, updates);
    await this.businessRepository.save(updatedBusiness);
    return this.findById(id, ["sector", "category", "subCategory"]);
  }

  async delete(id: string): Promise<void> {
    await this.businessRepository.delete(id);
  }

  async findAllParticipants(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<any>> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ["campaigns", "campaigns.participants"],
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const allParticipants = business.campaigns.flatMap(
      (campaign) => campaign.participants,
    );
    const uniqueParticipants = [
      ...new Map(allParticipants.map((item) => [item["id"], item])).values(),
    ];
    const total = uniqueParticipants.length;
    const totalPages = Math.ceil(total / limit);
    const next = page < totalPages ? Number(page) + 1 : null;
    const previous = page > 1 ? Number(page) - 1 : null;

    const paginatedParticipants = uniqueParticipants.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      data: paginatedParticipants,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      next,
      previous,
    };
  }

  async getOnboardingStatus(
    id: string,
  ): Promise<{ isOnboarded: boolean; missingFields: string[] }> {
    const business = await this.findById(id, [
      "sector",
      "category",
      "subCategory",
    ]);
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const missingFields = [];
    if (!business.sector) missingFields.push("sector");
    if (!business.category) missingFields.push("category");

    return {
      isOnboarded: missingFields.length === 0,
      missingFields,
    };
  }

  async getSubscriptionLevel(id: string): Promise<any> {
    const payments = await this.paymentHistoryService.findByBusiness(id);
    const latestPayment = payments[0];

    if (!latestPayment || !latestPayment.membership) {
      return {
        tier: "Free",
        status: "active",
        features: [],
      };
    }

    return {
      tier: latestPayment.membership.tier?.name || "Unknown",
      status: latestPayment.membership.status,
      expiresAt: latestPayment.membership.expires_at,
      planType: latestPayment.membership.plan_type,
    };
  }

  async getBillingHistory(id: string) {
    return this.paymentHistoryService.findByBusiness(id);
  }

  async getMonthlyPointBalance(businessId: string) {
    const business = await this.findById(businessId);
    const payments =
      await this.paymentHistoryService.findByBusiness(businessId);
    const latestPayment = payments[0];

    if (!latestPayment || !latestPayment.membership) {
      return {
        monthlyLimit: 0,
        used: 0,
        remaining: 0,
        extraPoints: 0,
        maxBuyable: 0,
      };
    }

    const membership = latestPayment.membership;
    const tierConfig = membership.tier.configuration;
    const monthlyAllowance = tierConfig?.quotas?.monthlyPointsAllowance || 0;

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usedPoints = await this.pointHistoryRepository.sum("points", {
      business: { id: businessId },
      type: PointHistoryType.EARN,
      created_at: MoreThanOrEqual(startOfMonth),
    });

    const used = usedPoints || 0;
    const extraPoints = business.extraPoints || 0;

    // Max buyable is strictly limited by the monthly allowance minus what has been used.
    const maxBuyable = Math.max(0, monthlyAllowance - used);

    return {
      monthlyLimit: monthlyAllowance,
      used: used,
      remaining: monthlyAllowance + extraPoints - used,
      extraPoints: extraPoints,
      maxBuyable: maxBuyable,
    };
  }

  async getMonthlyStampBalance(businessId: string) {
    const payments =
      await this.paymentHistoryService.findByBusiness(businessId);
    const latestPayment = payments[0];

    // Default to 0 allowance if no active membership
    let monthlyAllowance = 0;
    if (latestPayment && latestPayment.membership) {
      const membership = latestPayment.membership;
      const tierConfig = membership.tier.configuration;
      monthlyAllowance = tierConfig?.quotas?.monthlyStampsAllowance || 0;
    }

    const packageBalance =
      await this.stampPackageService.getAggregateBalance(businessId);

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalStampsAwardedResult = await this.pointHistoryRepository.sum(
      "stamps",
      {
        business: { id: businessId },
        type: PointHistoryType.STAMP_EARN,
        created_at: MoreThanOrEqual(startOfMonth),
      },
    );
    const totalStampsAwarded = totalStampsAwardedResult || 0;

    const packageStampsSpentResult = await this.pointHistoryRepository.sum(
      "stamps",
      {
        business: { id: businessId },
        type: PointHistoryType.BUSINESS_STAMP_SPENT,
        created_at: MoreThanOrEqual(startOfMonth),
      },
    );
    const packageStampsSpent = packageStampsSpentResult || 0;

    // Allowance used is total awarded minus what was covered by packages
    const allowanceUsed = Math.max(0, totalStampsAwarded - packageStampsSpent);
    const remainingAllowance = Math.max(0, monthlyAllowance - allowanceUsed);

    return {
      monthlyLimit: monthlyAllowance,
      used: allowanceUsed,
      remaining: remainingAllowance + packageBalance.total_balance,
      extraStamps: packageBalance.total_balance,
      maxBuyable: 0, // Placeholder, logic for buying limits if needed
    };
  }

  async getTotalSubscriptionPointBalance(businessId: string) {
    const payments =
      await this.paymentHistoryService.findByBusiness(businessId);
    const latestPayment = payments[0];

    if (!latestPayment || !latestPayment.membership) {
      return {
        totalAllowance: 0,
        totalUsed: 0,
        balance: 0,
      };
    }

    const membership = latestPayment.membership;
    const tierConfig = membership.tier.configuration;
    const monthlyAllowance = tierConfig?.quotas?.monthlyPointsAllowance || 0;

    const startDate = new Date(membership.starts_at);
    const endDate = new Date(membership.expires_at);

    let durationMonths = 1;
    if (membership.plan_type === "annual") durationMonths = 12;
    else if (membership.plan_type === "quarterly") durationMonths = 3;
    else durationMonths = 1; // monthly

    const totalAllowance = monthlyAllowance * durationMonths;

    const usedPoints = await this.pointHistoryRepository.sum("points", {
      business: { id: businessId },
      type: PointHistoryType.EARN,
      created_at: Between(startDate, endDate),
    });

    const totalUsed = usedPoints || 0;

    return {
      totalAllowance,
      totalUsed,
      balance: totalAllowance - totalUsed,
    };
  }

  async buyExtraPoints(businessId: string, points: number, provider: string) {
    const status = await this.getMonthlyPointBalance(businessId);

    if (points <= 0) {
      throw new BadRequestException("Points must be greater than 0");
    }

    if (points > status.maxBuyable) {
      throw new BadRequestException(
        `You cannot exceed your monthly limit. Max you can buy is ${status.maxBuyable}.`,
      );
    }

    // Get Cost Per Point from System Settings
    const costPerPointSetting =
      await this.systemSettingService.get("POINT_PRICE_GBP");

    if (!costPerPointSetting || parseFloat(costPerPointSetting) <= 0) {
      throw new BadRequestException(
        "Top-ups are currently disabled. Please contact support.",
      );
    }

    const costPerPoint = parseFloat(costPerPointSetting);
    const totalCost = points * costPerPoint;

    const paymentResult = await this.paymentService.initiatePointPurchase(
      { id: businessId },
      points,
      totalCost,
      provider,
    );

    return {
      success: true,
      ...paymentResult,
      cost: totalCost,
      currency: "GBP",
    };
  }

  async confirmPointPurchase(
    businessId: string,
    transactionId: string,
    provider: string,
  ) {
    const verification = await this.paymentService.verifyPointPurchase(
      { id: businessId },
      transactionId,
      provider,
    );

    if (verification.status === "succeeded") {
      // Credit Extra Points
      await this.businessRepository.increment(
        { id: businessId },
        "extraPoints",
        verification.points,
      );

      // Add Point History
      const pointHistory = this.pointHistoryRepository.create({
        business: { id: businessId },
        type: PointHistoryType.PURCHASED_EXTRA,
        points: verification.points,
        description: `Purchased ${verification.points} extra points`,
      });
      await this.pointHistoryRepository.save(pointHistory);

      // TODO: Generate Invoice / Admin Notification
      console.log(
        `Business ${businessId} purchased ${verification.points} points for £${verification.amount}`,
      );

      return {
        success: true,
        pointsPurchased: verification.points,
        newBalance: await this.getMonthlyPointBalance(businessId),
      };
    } else {
      throw new BadRequestException("Payment verification failed");
    }
  }

  async resetMonthlyPoints(businessId: string) {
    await this.businessRepository.update(businessId, { extraPoints: 0 });
    return { success: true, message: "Monthly points reset successfully" };
  }

  async getPointPurchaseConfig(businessId: string) {
    const status = await this.getMonthlyPointBalance(businessId);
    const costPerPointSetting =
      await this.systemSettingService.get("POINT_PRICE_GBP");
    const costPerPoint = costPerPointSetting
      ? parseFloat(costPerPointSetting)
      : 0;

    return {
      maxBuyablePoints: status.maxBuyable,
      costPerPoint: costPerPoint,
      currency: "GBP",
    };
  }
  async getOwnProfile(id: string): Promise<Business> {
    const business = await this.findById(id, [
      "sector",
      "category",
      "subCategory",
    ]);
    if (!business) {
      throw new NotFoundException("Business not found");
    }
    return business;
  }

  async updateOwnProfile(
    id: string,
    updateBusinessProfileDto: UpdateBusinessProfileDto,
  ): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException("Business not found");
    }
    const updatedBusiness = this.businessRepository.merge(
      business,
      updateBusinessProfileDto,
    );
    await this.businessRepository.save(updatedBusiness);
    return this.getOwnProfile(id);
  }

  async getTierUsage(businessId: string) {
    const business = await this.findById(businessId);
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const payments =
      await this.paymentHistoryService.findByBusiness(businessId);
    const latestPayment = payments[0];

    if (!latestPayment || !latestPayment.membership) {
      return {
        tierName: "Free",
        features: {
          campaigns: { limit: 0, used: 0, remaining: 0 },
          rewards: { limit: 0, used: 0, remaining: 0 },
          teamMembers: { limit: 0, used: 0, remaining: 0 },
          monthlyPoints: { limit: 0, used: 0, remaining: 0 },
        },
      };
    }

    const membership = latestPayment.membership;
    const tierConfig = membership.tier.configuration;
    const quotas = tierConfig.quotas;

    // Active Campaigns: Not disabled, and end_date >= now
    const activeCampaignsCount = await this.businessCampaignRepository.count({
      where: {
        business: { id: businessId },
        disabled: false,
        end_date: MoreThanOrEqual(new Date()),
      },
    });

    // Active Rewards: Status is ACTIVE
    const activeRewardsCount = await this.businessRewardRepository.count({
      where: {
        business: { id: businessId },
        status: RewardStatus.ACTIVE,
      },
    });

    // Team Members
    const teamMembersCount = await this.staffRepository.count({
      where: {
        business: { id: businessId },
      },
    });

    // Points
    const pointBalance = await this.getMonthlyPointBalance(businessId);

    const calculateRemaining = (limit: number, used: number) => {
      if (limit === -1) return -1; // Unlimited
      return Math.max(0, limit - used);
    };

    return {
      tierName: membership.tier.name,
      features: {
        campaigns: {
          limit: quotas.maxActiveCampaigns,
          used: activeCampaignsCount,
          remaining: calculateRemaining(
            quotas.maxActiveCampaigns,
            activeCampaignsCount,
          ),
        },
        rewards: {
          limit: quotas.maxActiveRewards,
          used: activeRewardsCount,
          remaining: calculateRemaining(
            quotas.maxActiveRewards,
            activeRewardsCount,
          ),
        },
        teamMembers: {
          limit: quotas.maxTeamMembers,
          used: teamMembersCount,
          remaining: calculateRemaining(
            quotas.maxTeamMembers,
            teamMembersCount,
          ),
        },
        monthlyPoints: {
          limit: pointBalance.monthlyLimit,
          used: pointBalance.used,
          remaining: pointBalance.remaining,
        },
      },
    };
  }
  async getReferralStats(businessId: string) {
    const business = await this.findById(businessId);
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const uploadedCount = await this.businessRepository.manager.count(
      "Network",
      {
        where: {
          business: { id: businessId },
        },
      },
    );

    const capacity = business.referralCapacity || 0;
    const remaining = Math.max(0, capacity - uploadedCount);
    const percentage = capacity > 0 ? (uploadedCount / capacity) * 100 : 0;

    return {
      referralCapacity: capacity,
      uploaded: uploadedCount,
      remaining: remaining,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  }
}
