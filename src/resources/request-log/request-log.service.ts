import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLog } from './entities/request-log.entity';
import { CreateRequestLogDto } from './dto/create-request-log.dto';

@Injectable()
export class RequestLogService {
  constructor(
    @InjectRepository(RequestLog)
    private readonly requestLogRepository: Repository<RequestLog>,
  ) {}

  async create(createRequestLogDto: CreateRequestLogDto): Promise<RequestLog> {
    const newLog = this.requestLogRepository.create(createRequestLogDto);
    return this.requestLogRepository.save(newLog);
  }
}
