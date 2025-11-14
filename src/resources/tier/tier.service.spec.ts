import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TierService } from './tier.service';
import { Tier } from './entities/tier.entity';

describe('TierService', () => {
  let service: TierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierService,
        {
          provide: getRepositoryToken(Tier),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<TierService>(TierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an array of tiers', async () => {
    expect(await service.findAll()).toEqual([]);
  });
});
