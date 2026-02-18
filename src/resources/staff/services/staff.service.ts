import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoid } from "nanoid";
import { Staff } from "../entities/staff.entity";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
import { HashService } from "../../../common/hash/hash.service";
import { PointHistory } from "../../participant-campaign-balance/entities/point-history.entity";

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    private readonly hashService: HashService,
  ) { }

  async create(
    createStaffDto: CreateStaffDto,
    businessId: string,
  ): Promise<Staff> {
    const existingStaff = await this.findByEmail(createStaffDto.email);
    if (existingStaff) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await this.hashService.hashPassword(
      createStaffDto.password,
    );
    const { confirmPassword, ...staffData } = createStaffDto;
    const staff = this.staffRepository.create({
      ...staffData,
      uniqueCode: nanoid(9),
      password: hashedPassword,
      business: { id: businessId },
    });
    return this.staffRepository.save(staff);
  }

  async findAll(
    businessId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Staff[]; total: number }> {
    const [data, total] = await this.staffRepository.findAndCount({
      where: { business: { id: businessId } },
      order: { created_at: "DESC" },
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

  async update(
    id: string,
    updateStaffDto: UpdateStaffDto,
    businessId?: string,
  ): Promise<Staff> {
    if (updateStaffDto.password) {
      updateStaffDto.password = await this.hashService.hashPassword(
        updateStaffDto.password,
      );
    }

    const staff = await this.findOne(id, businessId);
    if (!staff) {
      throw new NotFoundException("Staff not found");
    }

    const updatedStaff = this.staffRepository.merge(staff, updateStaffDto);
    return this.staffRepository.save(updatedStaff);
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.staffRepository.delete({ id, business: { id: businessId } });
  }

  async findByEmail(email: string): Promise<Staff | undefined> {
    return this.staffRepository.findOne({ where: { email } });
  }

  async getActivities(
    staffId: string,
    page: number,
    limit: number,
  ): Promise<{ data: PointHistory[]; total: number }> {
    const [data, total] = await this.pointHistoryRepository.findAndCount({
      where: { initiated_by_staff: { id: staffId } },
      relations: [
        "participant",
        "campaign",
        "businessCampaign",
        "reward",
        "businessReward",
      ],
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
