import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { nanoid } from 'nanoid';
import { Business } from '../entities/business.entity';
import { Referral, ReferralStatus } from '../../referral/entities/referral.entity';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { OnboardingDto } from '../dto/onboarding.dto';
import { HashService } from '../../../common/hash/hash.service';
import { SectorService } from '../../sector/services/sector.service';
import { CategoryService } from '../../category/category.service';
import { SubcategoryService } from '../../subcategory/subcategory.service';
import { PaginationResult } from '../../../common/interfaces/pagination-result.interface';
import { PaymentHistoryService } from '../../payment-history/payment-history.service';
import { PointHistory, PointHistoryType } from '../../participant-campaign-balance/entities/point-history.entity';
import { SystemSettingService } from '../../system-setting/services/system-setting.service';

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

    async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
        const existingBusiness = await this.findByEmail(createBusinessDto.email);
        if (existingBusiness) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await this.hashService.hashPassword(createBusinessDto.password);
        const { confirmPassword, referralCode, ...rest } = createBusinessDto;

        let referrer: Business;
        if (referralCode) {
            referrer = await this.findByAffiliateCode(referralCode);
            if (!referrer) {
                throw new BadRequestException('Invalid referral code');
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
        });
        const newBusiness = await this.businessRepository.save(business);

        if (referrer) {
            const referral = this.referralRepository.create({
                referrer,
                referred: newBusiness,
            });
            await this.referralRepository.save(referral);
        }

        return newBusiness;
    }

    async onboarding(id: string, onboardingDto: OnboardingDto): Promise<Business> {
        const business = await this.findById(id);
        if (!business) {
            throw new NotFoundException('Business not found');
        }

        const { sectorId, categoryId, subCategoryId, ...rest } = onboardingDto;

        const sector = await this.sectorService.findOne(sectorId);
        if (!sector) {
            throw new NotFoundException('Sector not found');
        }

        let category = null;
        if (categoryId) {
            category = await this.categoryService.findOne(categoryId);
            if (!category) {
                throw new NotFoundException('Category not found');
            }
            if (category.sector.id !== sectorId) {
                throw new ConflictException('Category does not belong to the selected sector');
            }
        }

        let subCategory = null;
        if (subCategoryId) {
            subCategory = await this.subcategoryService.findOne(subCategoryId);
            if (!subCategory) {
                throw new NotFoundException('Subcategory not found');
            }
            if (subCategory.category.id !== categoryId) {
                throw new ConflictException('Subcategory does not belong to the selected category');
            }
        }

        const updatedBusiness = {
            ...business,
            ...rest,
            sector,
            category,
            subCategory,
        };

        const savedBusiness = await this.businessRepository.save(updatedBusiness);

        if (savedBusiness.referredBy) {
            await this.completeReferral(savedBusiness);
        }

        return savedBusiness;
    }

    private async completeReferral(business: Business): Promise<void> {
        const referral = await this.referralRepository.findOne({
            where: { referred: { id: business.id } },
            relations: ['referrer'],
        });

        if (referral && referral.status === ReferralStatus.PENDING) {
            referral.status = ReferralStatus.COMPLETED;
            await this.referralRepository.save(referral);

            const referrer = referral.referrer;
            referrer.referralPoints = (referrer.referralPoints || 0) + 100;
            await this.businessRepository.save(referrer);
        }
    }

    async findByEmail(email: string): Promise<Business | undefined> {
        return this.businessRepository.findOne({ where: { email } });
    }

    async findByUniqueCode(uniqueCode: string): Promise<Business | undefined> {
        return this.businessRepository.findOne({ where: { uniqueCode } });
    }

    async findByAffiliateCode(affiliateCode: string): Promise<Business | undefined> {
        return this.businessRepository.findOne({ where: { affiliateCode } });
    }

    async getAffiliateCode(id: string): Promise<string> {
        const business = await this.findById(id);
        if (!business) {
            throw new NotFoundException('Business not found');
        }
        if (business.affiliateCode) {
            return business.affiliateCode;
        }
        const affiliateCode = await this.generateAffiliateCode();
        await this.businessRepository.update(id, { affiliateCode });
        return affiliateCode;
    }

    async findById(id: string, relations: string[] = []): Promise<Business | undefined> {
        return this.businessRepository.findOne({ where: { id }, relations });
    }

    async findAll(page: number, limit: number): Promise<PaginationResult<Business>> {
        const [data, total] = await this.businessRepository.findAndCount({
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['sector', 'category', 'subCategory'],
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

    async update(id: string, updateBusinessDto: UpdateBusinessDto): Promise<Business> {
        await this.businessRepository.update(id, updateBusinessDto);
        return this.findById(id);
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
            relations: ['campaigns', 'campaigns.participants'],
        });

        if (!business) {
            throw new NotFoundException('Business not found');
        }

        const allParticipants = business.campaigns.flatMap((campaign) => campaign.participants);
        const uniqueParticipants = [...new Map(allParticipants.map((item) => [item['id'], item])).values()];
        const total = uniqueParticipants.length;
        const totalPages = Math.ceil(total / limit);
        const next = page < totalPages ? Number(page) + 1 : null;
        const previous = page > 1 ? Number(page) - 1 : null;

        const paginatedParticipants = uniqueParticipants.slice((page - 1) * limit, page * limit);

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

    async getOnboardingStatus(id: string): Promise<{ isOnboarded: boolean; missingFields: string[] }> {
        const business = await this.findById(id, ['sector', 'category', 'subCategory']);
        if (!business) {
            throw new NotFoundException('Business not found');
        }

        const missingFields = [];
        if (!business.sector) missingFields.push('sector');
        if (!business.category) missingFields.push('category');

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
                tier: 'Free',
                status: 'active',
                features: [],
            };
        }

        return {
            tier: latestPayment.membership.tier?.name || 'Unknown',
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
        const payments = await this.paymentHistoryService.findByBusiness(businessId);
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

        const usedPoints = await this.pointHistoryRepository.sum('points', {
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
            remaining: (monthlyAllowance + extraPoints) - used,
            extraPoints: extraPoints,
            maxBuyable: maxBuyable,
        };
    }

    async getTotalSubscriptionPointBalance(businessId: string) {
        const payments = await this.paymentHistoryService.findByBusiness(businessId);
        const latestPayment = payments[0];

        if (!latestPayment || !latestPayment.membership) {
            return {
                totalAllowance: 0,
                totalUsed: 0,
                balance: 0
            };
        }

        const membership = latestPayment.membership;
        const tierConfig = membership.tier.configuration;
        const monthlyAllowance = tierConfig?.quotas?.monthlyPointsAllowance || 0;

        const startDate = new Date(membership.starts_at);
        const endDate = new Date(membership.expires_at);

        let durationMonths = 1;
        if (membership.plan_type === 'annual') durationMonths = 12;
        else if (membership.plan_type === 'quarterly') durationMonths = 3;
        else durationMonths = 1; // monthly

        const totalAllowance = monthlyAllowance * durationMonths;

        const usedPoints = await this.pointHistoryRepository.sum('points', {
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

    async buyExtraPoints(businessId: string, points: number, paymentMethod: string) {
        const status = await this.getMonthlyPointBalance(businessId);

        if (points <= 0) {
            throw new BadRequestException('Points must be greater than 0');
        }

        if (points > status.maxBuyable) {
            throw new BadRequestException(`You cannot exceed your monthly limit. Max you can buy is ${status.maxBuyable}.`);
        }

        // Get Cost Per Point from System Settings
        const costPerPointSetting = await this.systemSettingService.get('POINT_PRICE_GBP');

        if (!costPerPointSetting || parseFloat(costPerPointSetting) <= 0) {
            throw new BadRequestException('Top-ups are currently disabled. Please contact support.');
        }

        const costPerPoint = parseFloat(costPerPointSetting);
        const totalCost = points * costPerPoint;

        // Credit Extra Points
        await this.businessRepository.increment({ id: businessId }, 'extraPoints', points);

        // Add Point History
        const pointHistory = this.pointHistoryRepository.create({
            business: { id: businessId },
            type: PointHistoryType.PURCHASED_EXTRA,
            points: points,
            description: `Purchased ${points} extra points`,
        });
        await this.pointHistoryRepository.save(pointHistory);

        // TODO: Generate Invoice / Admin Notification
        console.log(`Business ${businessId} purchased ${points} points for £${totalCost}`);

        return {
            success: true,
            pointsPurchased: points,
            cost: totalCost,
            newBalance: await this.getMonthlyPointBalance(businessId)
        };
    }

    async resetMonthlyPoints(businessId: string) {
        await this.businessRepository.update(businessId, { extraPoints: 0 });
        return { success: true, message: 'Monthly points reset successfully' };
    }
}