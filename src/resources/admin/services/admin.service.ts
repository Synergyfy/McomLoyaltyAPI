import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { BusinessService } from '../../business/services/business.service';
import { StaffService } from '../../staff/services/staff.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { HashService } from '../../../common/hash/hash.service';
import { Campaign } from 'src/resources/campaign/entities/campaign.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly businessService: BusinessService,
    private readonly staffService: StaffService,
    private readonly hashService: HashService,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.findByEmail(createAdminDto.email);
    if (existingAdmin) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashService.hashPassword(
      createAdminDto.password,
    );
    const { confirmPassword, ...adminData } = createAdminDto;
    const admin = this.adminRepository.create({
      ...adminData,
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

  async toggleMatchingPoints(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    campaign.matching_points_disabled_by_admin =
      !campaign.matching_points_disabled_by_admin;
    return this.campaignRepository.save(campaign);
  }
}
