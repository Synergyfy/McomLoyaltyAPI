
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { HashService } from '../../../common/hash/hash.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
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
}
