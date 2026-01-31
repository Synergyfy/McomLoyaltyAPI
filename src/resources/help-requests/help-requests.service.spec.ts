import { Test, TestingModule } from '@nestjs/testing';
import { HelpRequestsService } from './help-requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HelpRequest, HelpRequestType } from './entities/help-request.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

const mockRepo = {
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((req) => Promise.resolve({ id: 'uuid-1', ...req })),
  find: jest.fn().mockResolvedValue([]),
};

const mockHttp = {
  post: jest.fn().mockReturnValue(of({ data: { success: true } })),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('http://localhost:3010/api/v1'),
};

describe('HelpRequestsService (Loyalty)', () => {
  let service: HelpRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelpRequestsService,
        { provide: getRepositoryToken(HelpRequest), useValue: mockRepo },
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<HelpRequestsService>(HelpRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create request and forward to central', async () => {
    const dto = {
      type: HelpRequestType.CAMPAIGN_CREATION,
      title: 'Help',
      description: 'Desc',
    };
    const result = await service.create('user-1', dto);
    
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockHttp.post).toHaveBeenCalledWith(
      'http://localhost:3010/api/v1/tasks',
      expect.objectContaining({
        taskType: HelpRequestType.CAMPAIGN_CREATION,
        originSystem: 'MCOM_LOYALTY'
      })
    );
    expect(result.id).toBe('uuid-1');
  });
});
