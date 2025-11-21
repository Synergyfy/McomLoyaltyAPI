import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

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

  async findAll(page: number, limit: number): Promise<{ data: Business[], total: number }> {
    const [data, total] = await this.businessRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
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
  ): Promise<{ data: any[]; total: number }> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
      relations: ['campaigns', 'campaigns.participants'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const allParticipants = business.campaigns.flatMap((campaign) => campaign.participants);
    const uniqueParticipants = [...new Map(allParticipants.map((item) => [item['id'], item])).values()];
    const paginatedParticipants = uniqueParticipants.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedParticipants,
      total: uniqueParticipants.length,
    };
  }
}