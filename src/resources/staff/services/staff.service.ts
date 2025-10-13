
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { HashService } from '../../../common/hash/hash.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly hashService: HashService,
  ) {}

  async create(createStaffDto: CreateStaffDto, businessId: string): Promise<Staff> {
    const hashedPassword = await this.hashService.hashPassword(createStaffDto.password);
    const staff = this.staffRepository.create({
      ...createStaffDto,
      password: hashedPassword,
      business: { id: businessId },
    });
    return this.staffRepository.save(staff);
  }

  findAll(businessId: string, page: number, limit: number): Promise<{ data: Staff[], total: number }> {
    return this.staffRepository.findAndCount({
      where: { business: { id: businessId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findOne(id: string, businessId: string): Promise<Staff> {
    return this.staffRepository.findOne({ where: { id, business: { id: businessId } } });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto, businessId: string): Promise<Staff> {
    if (updateStaffDto.password) {
      updateStaffDto.password = await this.hashService.hashPassword(updateStaffDto.password);
    }
    await this.staffRepository.update({ id, business: { id: businessId } }, updateStaffDto);
    return this.findOne(id, businessId);
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.staffRepository.delete({ id, business: { id: businessId } });
  }

  async findByEmail(email: string): Promise<Staff | undefined> {
    return this.staffRepository.findOne({ where: { email } });
  }
}
