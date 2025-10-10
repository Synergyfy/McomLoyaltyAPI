
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
    const hashedPassword = await this.hashService.hash(createBusinessDto.password);
    const business = this.businessRepository.create({
      ...createBusinessDto,
      password: hashedPassword,
    });
    return this.businessRepository.save(business);
  }

  async findByEmail(email: string): Promise<Business | undefined> {
    return this.businessRepository.findOne({ where: { email } });
  }
}
