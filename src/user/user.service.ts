import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from '../resources/admin/entities/admin.entity';
import { Business } from '../resources/business/entities/business.entity';
import { Staff } from '../resources/staff/entities/staff.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async findOne(email: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (admin) return admin;

    const business = await this.businessRepository.findOne({ where: { email } });
    if (business) return business;

    const staff = await this.staffRepository.findOne({ where: { email } });
    if (staff) return staff;

    return null;
  }
}