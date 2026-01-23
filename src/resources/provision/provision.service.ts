import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Provision, ProvisionType } from "./entities/provision.entity";
import { CreateProvisionDto } from "./dto/create-provision.dto";

@Injectable()
export class ProvisionService {
  constructor(
    @InjectRepository(Provision)
    private readonly provisionRepository: Repository<Provision>,
  ) {}

  async create(createProvisionDto: CreateProvisionDto): Promise<Provision> {
    const exists = await this.provisionRepository.findOne({ where: { code: createProvisionDto.code } });
    if (exists) {
        // If code exists, maybe return it or throw error. For idempotency, we return existing if not redeemed.
        if (exists.isRedeemed) throw new BadRequestException("Code already exists and is redeemed");
        return exists;
    }

    const provision = this.provisionRepository.create({
        ...createProvisionDto,
        expiresAt: new Date(createProvisionDto.expiresAt)
    });
    return this.provisionRepository.save(provision);
  }

  async validateAndMarkRedeemed(code: string, userId: string): Promise<Provision> {
    const provision = await this.provisionRepository.findOne({ where: { code } });
    if (!provision) {
      throw new NotFoundException("Invalid redemption code");
    }

    if (provision.isRedeemed) {
      throw new BadRequestException("Code already redeemed");
    }

    if (new Date() > provision.expiresAt) {
      throw new BadRequestException("Code expired");
    }

    provision.isRedeemed = true;
    provision.redeemedAt = new Date();
    provision.redeemedByUserId = userId;

    return this.provisionRepository.save(provision);
  }
  
  async findByCode(code: string): Promise<Provision> {
      return this.provisionRepository.findOne({ where: { code } });
  }
}
