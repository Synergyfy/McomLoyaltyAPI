import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { Staff } from '../entities/staff.entity';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { ActionType, CapabilityService } from '../../capability/capability.service';
import { HashService } from '../../../common/hash/hash.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly hashService: HashService,
    private readonly capabilityService: CapabilityService,
  ) { }

  async create(createStaffDto: CreateStaffDto, businessId: string): Promise<Staff> {
    await this.capabilityService.checkPermission(businessId, ActionType.CREATE_STAFF);

    const existingStaff = await this.findByEmail(createStaffDto.email);
    if (existingStaff) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashService.hashPassword(createStaffDto.password);
    const { confirmPassword, ...staffData } = createStaffDto;
    const staff = this.staffRepository.create({
      ...staffData,
      uniqueCode: nanoid(9),
      password: hashedPassword,
      business: { id: businessId },
    });
    return this.staffRepository.save(staff);
  }

  async findAll(businessId: string, page: number, limit: number): Promise<{ data: Staff[], total: number }> {
    const [data, total] = await this.staffRepository.findAndCount({
      where: { business: { id: businessId } },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  findOne(id: string, businessId?: string): Promise<Staff> {
    const where: any = { id };
    if (businessId) {
      where.business = { id: businessId };
    }
    return this.staffRepository.findOne({ where });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto, businessId?: string): Promise<Staff> {
    if (updateStaffDto.password) {
      updateStaffDto.password = await this.hashService.hashPassword(updateStaffDto.password);
    }
    const where: any = { id };
    if (businessId) {
      where.business = { id: businessId };
    }
    await this.staffRepository.update(where, updateStaffDto);
    return this.findOne(id, businessId);
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.staffRepository.delete({ id, business: { id: businessId } });
  }

  async findByEmail(email: string): Promise<Staff | undefined> {
    return this.staffRepository.findOne({ where: { email } });
  }
}