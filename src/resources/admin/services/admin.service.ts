import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { BusinessService } from 'src/resources/business/services/business.service';
import { StaffService } from 'src/resources/staff/services/staff.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { HashService } from 'src/common/hash/hash.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly businessService: BusinessService,
    private readonly staffService: StaffService,
    private readonly hashService: HashService,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const hashedPassword = await this.hashService.hashPassword(createAdminDto.password);
    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });
    return this.adminRepository.save(admin);
  }

  async findByEmail(email: string): Promise<Admin | undefined> {
    return this.adminRepository.findOne({ where: { email } });
  }

  async getBusinesses(page: number, limit: number) {
    return this.businessService.findAll(page, limit);
  }

  async getStaffs(businessId: string, page: number, limit: number) {
    return this.staffService.findAll(businessId, page, limit);
  }
}
