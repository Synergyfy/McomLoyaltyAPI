import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedIp } from './entities/ip-block.entity';
import { CreateIpBlockDto } from './dto/create-ip-block.dto';

@Injectable()
export class IpBlockService {
  constructor(
    @InjectRepository(BlockedIp)
    private readonly blockedIpRepository: Repository<BlockedIp>,
  ) {}

  async create(createIpBlockDto: CreateIpBlockDto): Promise<BlockedIp> {
    const newBlockedIp = this.blockedIpRepository.create(createIpBlockDto);
    return this.blockedIpRepository.save(newBlockedIp);
  }

  async findAll(): Promise<BlockedIp[]> {
    return this.blockedIpRepository.find();
  }

  async findOne(ip: string): Promise<BlockedIp> {
    return this.blockedIpRepository.findOne({ where: { ip } });
  }

  async remove(ip: string): Promise<void> {
    await this.blockedIpRepository.delete({ ip });
  }
}
