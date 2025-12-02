
import { Test, TestingModule } from '@nestjs/testing';
import { RewardsService } from './rewards.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reward } from '../entities/reward.entity';
import { BusinessReward } from '../entities/business-reward.entity';
import { Business } from '../../business/entities/business.entity';
import { Membership } from '../../membership/entities/membership.entity';
import { Sector } from '../../sector/entities/sector.entity';
import { Tier } from '../../tier/entities/tier.entity';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { RewardType } from '../enums/reward-type.enum';
import { BadgeLevel } from '../enums/badge-level.enum';
import { RewardSource } from '../enums/reward-source.enum';
import { RewardAudience } from '../enums/reward-audience.enum';
import { RewardStatus } from '../enums/reward-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardRepository: Repository<Reward>;
  let sectorRepository: Repository<Sector>;
  let tierRepository: Repository<Tier>;

  const mockRewardRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockBusinessRewardRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBusinessRepository = {};
  const mockMembershipRepository = {};

  const mockSectorRepository = {
    findBy: jest.fn(),
  };

  const mockTierRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: getRepositoryToken(Reward), useValue: mockRewardRepository },
        { provide: getRepositoryToken(BusinessReward), useValue: mockBusinessRewardRepository },
        { provide: getRepositoryToken(Business), useValue: mockBusinessRepository },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepository },
        { provide: getRepositoryToken(Sector), useValue: mockSectorRepository },
        { provide: getRepositoryToken(Tier), useValue: mockTierRepository },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    rewardRepository = module.get<Repository<Reward>>(getRepositoryToken(Reward));
    sectorRepository = module.get<Repository<Sector>>(getRepositoryToken(Sector));
    tierRepository = module.get<Repository<Tier>>(getRepositoryToken(Tier));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReward', () => {
    const createRewardDto: CreateRewardDto = {
      title: 'Test Reward',
      max_points: 100,
      value: 10,
      description: 'Test Description',
      image: 'image-url',
      reward_type: RewardType.VOUCHER,
      reward_source: RewardSource.MCOM_VAULT,
      audience: RewardAudience.ALL_BUSINESS,
      status: RewardStatus.ACTIVE,
    };

    it('should create a reward without sectors or tiers', async () => {
      mockRewardRepository.create.mockReturnValue(createRewardDto);
      mockRewardRepository.save.mockResolvedValue(createRewardDto);

      const result = await service.createReward(createRewardDto);
      expect(result).toEqual(createRewardDto);
      expect(mockRewardRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...createRewardDto,
        sectors: [],
        tiers: [],
      }));
    });

    it('should create a reward with valid sectors', async () => {
      const sectors = [{ id: 's1', name: 'Sector 1' }] as Sector[];
      mockSectorRepository.findBy.mockResolvedValue(sectors);
      mockRewardRepository.create.mockReturnValue({ ...createRewardDto, sectors });
      mockRewardRepository.save.mockResolvedValue({ ...createRewardDto, sectors });

      const dto = { ...createRewardDto, sector_ids: ['s1'] };
      const result = await service.createReward(dto);

      expect(mockSectorRepository.findBy).toHaveBeenCalledWith({ id: expect.any(Object) }); // In(['s1'])
      expect(mockRewardRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        sectors: sectors,
      }));
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if sector not found', async () => {
      mockSectorRepository.findBy.mockResolvedValue([]);
      const dto = { ...createRewardDto, sector_ids: ['s1'] };

      await expect(service.createReward(dto)).rejects.toThrow(NotFoundException);
    });

    it('should create a reward with valid tiers', async () => {
      const tiers = [{ id: 't1', name: 'Tier 1' }] as Tier[];
      mockTierRepository.findBy.mockResolvedValue(tiers);
      mockRewardRepository.create.mockReturnValue({ ...createRewardDto, tiers });
      mockRewardRepository.save.mockResolvedValue({ ...createRewardDto, tiers });

      const dto = { ...createRewardDto, tier_ids: ['t1'] };
      const result = await service.createReward(dto);

      expect(mockTierRepository.findBy).toHaveBeenCalledWith({ id: expect.any(Object) });
      expect(mockRewardRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        tiers: tiers,
      }));
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if tier not found', async () => {
      mockTierRepository.findBy.mockResolvedValue([]);
      const dto = { ...createRewardDto, tier_ids: ['t1'] };

      await expect(service.createReward(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBusinessReward', () => {
    const updateDto = { quantity: 50 };
    const businessId = 'b1';
    const rewardId = 'r1';
    const businessReward = { id: rewardId, business: { id: businessId }, quantity: 100 } as BusinessReward;

    it('should update a business reward successfully', async () => {
      mockBusinessRewardRepository.findOne.mockResolvedValue(businessReward);
      mockBusinessRewardRepository.save.mockResolvedValue({ ...businessReward, ...updateDto });

      const result = await service.updateBusinessReward(businessId, rewardId, updateDto);

      expect(mockBusinessRewardRepository.findOne).toHaveBeenCalledWith({
        where: { id: rewardId, business: { id: businessId } },
      });
      expect(mockBusinessRewardRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...businessReward,
        ...updateDto,
      }));
      expect(result).toEqual(expect.objectContaining(updateDto));
    });

    it('should throw NotFoundException if reward not found', async () => {
      mockBusinessRewardRepository.findOne.mockResolvedValue(null);

      await expect(service.updateBusinessReward(businessId, rewardId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });
});
