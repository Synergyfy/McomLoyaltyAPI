import { Test, TestingModule } from '@nestjs/testing';
import { TierController } from './tier.controller';
import { TierService } from './tier.service';

describe('TierController', () => {
  let controller: TierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TierController],
      providers: [
        {
          provide: TierService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<TierController>(TierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
