import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HelpRequest, HelpRequestType } from './entities/help-request.entity';
import { CreateHelpRequestDto } from './dto/create-help-request.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class HelpRequestsService {
  private readonly logger = new Logger(HelpRequestsService.name);
  private centralUrl: string;

  constructor(
    @InjectRepository(HelpRequest)
    private helpRequestRepo: Repository<HelpRequest>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.centralUrl = this.configService.get<string>('MCOM_CENTRAL_URL') || 'http://localhost:3010/api/v1';
  }

  async create(userId: string, dto: CreateHelpRequestDto): Promise<HelpRequest> {
    // 1. Save Local Request
    const helpRequest = this.helpRequestRepo.create({
      requesterId: userId,
      ...dto,
      status: 'SUBMITTED',
    });
    const savedRequest = await this.helpRequestRepo.save(helpRequest);

    // 2. Send to Mcom Central
    try {
      const centralPayload = {
        title: `[Loyalty] ${dto.title}`, // Prefixing for clarity
        description: `Type: ${dto.type}\n\n${dto.description}`,
        taskType: dto.type,
        originSystem: 'MCOM_LOYALTY',
        originRequesterId: userId,
        // Optional: passing local ID could help future sync
      };

      await lastValueFrom(
        this.httpService.post(`${this.centralUrl}/tasks`, centralPayload, {
          headers: {
            'x-api-key': this.configService.get<string>('INTERNAL_API_KEY'),
          },
        })
      );
      
      this.logger.log(`Help request ${savedRequest.id} forwarded to Central.`);
    } catch (error) {
      this.logger.error(`Failed to forward help request to Central: ${error.message}`, error.stack);
      // We don't fail the local creation, but might want to mark it as 'SYNC_FAILED' or retry later.
      // For now, keeping it simple.
    }

    return savedRequest;
  }

  async findAll(userId: string) {
    return this.helpRequestRepo.find({ where: { requesterId: userId }, order: { createdAt: 'DESC' } });
  }
}
