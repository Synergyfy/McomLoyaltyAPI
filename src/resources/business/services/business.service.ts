import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { OnboardingDto } from '../dto/onboarding.dto';
import { HashService } from '../../../common/hash/hash.service';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly hashService: HashService,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const existingBusiness = await this.findByEmail(createBusinessDto.email);
    if (existingBusiness) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashService.hashPassword(createBusinessDto.password);
    const { confirmPassword, ...rest } = createBusinessDto;

    let uniqueCode: string;
    let isUnique = false;
    while (!isUnique) {
      uniqueCode = Math.floor(100000000 + Math.random() * 900000000).toString();
      const existingBusiness = await this.findByUniqueCode(uniqueCode);
      if (!existingBusiness) {
        isUnique = true;
      }
    }

    const business = this.businessRepository.create({
      ...rest,
      password: hashedPassword,
      uniqueCode,
    });
    return this.businessRepository.save(business);
  }

  async onboarding(id: string, onboardingDto: OnboardingDto): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const { sectorId, ...rest } = onboardingDto;
    const updatedBusiness = {
      ...business,
      ...rest,
      sector: { id: sectorId },
    };

    return this.businessRepository.save(updatedBusiness);
  }

  async findByEmail(email: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { email } });
  }

  async findByUniqueCode(uniqueCode: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { uniqueCode } });
  }

  async findById(id: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { id } });
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
}