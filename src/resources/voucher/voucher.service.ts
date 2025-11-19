import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { User } from 'src/common/interfaces/user.interface';
import { Role } from 'src/common/role.enum';
import { VoucherStatus } from './entities/voucher-status.enum';
import { VoucherFilterDto } from './dto/voucher-filter.dto';
import { VoucherValueType } from './entities/voucher-value-type.enum';
import { ParticipantCampaignBalanceService } from '../participant-campaign-balance/services/participant-campaign-balance.service';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    private readonly participantCampaignBalanceService: ParticipantCampaignBalanceService,
    private readonly entityManager: EntityManager,
  ) {}

  async create(
    createVoucherDto: CreateVoucherDto,
    user: User,
  ): Promise<Voucher> {
    const voucher = this.voucherRepository.create({
      ...createVoucherDto,
      creatorId: user.id,
      creatorType: user.role,
    });
    return this.voucherRepository.save(voucher);
  }

  async findAll(user: User, filterDto: VoucherFilterDto): Promise<any> {
    const { page, limit } = filterDto;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (user.role === Role.Business) {
      where = { creatorId: user.id };
    }

    const [data, total] = await this.voucherRepository.findAndCount({
      where,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, user: User): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID "${id}" not found`);
    }
    if (user.role !== Role.Admin && voucher.creatorId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to access this voucher',
      );
    }
    return voucher;
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
    user: User,
  ): Promise<Voucher> {
    const voucher = await this.findOne(id, user); // findOne handles auth checks
    const updatedVoucher = this.voucherRepository.merge(
      voucher,
      updateVoucherDto,
    );
    return this.voucherRepository.save(updatedVoucher);
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user); // findOne handles auth checks
    await this.voucherRepository.delete(id);
  }

  async redeem(voucherId: string, participantId: string, campaignId: string): Promise<Voucher> {
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      const voucher = await transactionalEntityManager.findOne(Voucher, {
        where: { id: voucherId },
      });

      if (!voucher) {
        throw new NotFoundException(`Voucher with ID "${voucherId}" not found`);
      }

      // Pre-Check 2: Availability
      voucher.updateStatus();
      if (voucher.status !== VoucherStatus.ACTIVE && voucher.status !== VoucherStatus.PARTIALLY_REDEEMED) {
        throw new BadRequestException(`Voucher is not active. Current status: ${voucher.status}`);
      }

      // Pre-Check 1: User Points Eligibility
      if (voucher.valueType === VoucherValueType.POINTS) {
        const balance = await this.participantCampaignBalanceService.findOneByParticipantAndCampaign(participantId, campaignId);
        if (!balance || balance.campaign_balance < voucher.valueCost) {
          throw new BadRequestException('Insufficient points to redeem this voucher.');
        }
        // Deduct points
        await this.participantCampaignBalanceService.decrement(balance.id, voucher.valueCost);
      }

      // Transaction: Increment redeemed quantity
      voucher.redeemedQuantity += 1;
      voucher.updateStatus();

      return transactionalEntityManager.save(voucher);
    });
  }
}
