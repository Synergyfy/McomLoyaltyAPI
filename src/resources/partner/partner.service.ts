import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Partner } from "./entities/partner.entity";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
  ) {}

  async create(createPartnerDto: CreatePartnerDto) {
    const existing = await this.partnerRepository.findOne({
      where: { email: createPartnerDto.email },
    });
    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(createPartnerDto.password, 10);
    const partner = this.partnerRepository.create({
      ...createPartnerDto,
      subCategory: { id: createPartnerDto.subCategoryId } as any,
      password: hashedPassword,
    });

    return this.partnerRepository.save(partner);
  }

  async findByEmail(email: string) {
    return this.partnerRepository.findOne({ where: { email } });
  }
}
