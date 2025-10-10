
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { HashService } from '../../common/hash/hash.service';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly hashService: HashService,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    const hashedPassword = await this.hashService.hashPassword(createBusinessDto.password);
    const { sectorId, ...rest } = createBusinessDto;

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
      sector: { id: sectorId },
    });
    return this.businessRepository.save(business);
  }

  async findByEmail(email: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { email } });
  }

  async findByUniqueCode(uniqueCode: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { uniqueCode } });
  }
}
