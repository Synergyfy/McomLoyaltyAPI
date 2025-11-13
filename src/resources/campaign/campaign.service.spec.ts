import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { Business } from '../business/entities/business.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Repository } from 'typeorm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { Role } from '../../common/role.enum';
import { Admin } from '../admin/entities/admin.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PointHistory } from '../participant-campaign-balance/entities/point-history.entity';
import { Participant } from '../participant/entities/participant.entity';

describe('CampaignService', () => {
  let service: CampaignService;
  let campaignRepository: Repository<Campaign>;
  let businessRepository: Repository<Business>;
  let rewardRepository: Repository<Reward>;

  const mockCampaignRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  };

  const mockBusinessRepository = {
    findOneBy: jest.fn(),
  };

  const mockRewardRepository = {
    findBy: jest.fn(),
  };

  const mockPointHistoryRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockParticipantRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: getRepositoryToken(Reward),
          useValue: mockRewardRepository,
        },
        {
          provide: getRepositoryToken(PointHistory),
          useValue: mockPointHistoryRepository,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    campaignRepository = module.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
    businessRepository = module.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
    rewardRepository = module.get<Repository<Reward>>(
      getRepositoryToken(Reward),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a campaign for an admin', async () => {
      const createCampaignDto: CreateCampaignDto = {
        name: 'Test Campaign',
        campaign_type: 'qr_code' as any,
        campaign_message: 'Test Message',
        start_date: new Date(),
        end_date: new Date(),
        quantity: 10,
        audience_type: 'members' as any,
        banner_url: 'test.jpg',
        cta_text: 'Click Me',
        cta_background_color: '#000000',
        cta_text_color: '#ffffff',
        text_color: '#000000',
        background_color: '#ffffff',
        reward_ids: ['reward-id'],
        reward_type: 'regular' as any,
      };

      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const business = { id: 'business-id' } as Business;
      const rewards = [{ id: 'reward-id' }] as Reward[];
      const campaign = { ...createCampaignDto, business, rewards };

      mockBusinessRepository.findOneBy.mockResolvedValue(business);
      mockRewardRepository.findBy.mockResolvedValue(rewards);
      mockCampaignRepository.create.mockReturnValue(campaign);
      mockCampaignRepository.save.mockResolvedValue(campaign);

      const result = await service.create(createCampaignDto, currentUser);

      expect(result).toEqual(campaign);
    });

    it('should create a campaign for a business', async () => {
      const createCampaignDto: CreateCampaignDto = {
        name: 'Test Campaign',
        campaign_type: 'qr_code' as any,
        campaign_message: 'Test Message',
        start_date: new Date(),
        end_date: new Date(),
        quantity: 10,
        audience_type: 'members' as any,
        banner_url: 'test.jpg',
        cta_text: 'Click Me',
        cta_background_color: '#000000',
        cta_text_color: '#ffffff',
        text_color: '#000000',
        background_color: '#ffffff',
        reward_ids: ['reward-id'],
        reward_type: 'regular' as any,
      };

      const currentUser = {
        id: 'business-id',
        role: Role.Business,
      } as Business;

      const business = { id: 'business-id' } as Business;
      const rewards = [{ id: 'reward-id' }] as Reward[];
      const campaign = { ...createCampaignDto, business, rewards };

      mockBusinessRepository.findOneBy.mockResolvedValue(business);
      mockRewardRepository.findBy.mockResolvedValue(rewards);
      mockCampaignRepository.create.mockReturnValue(campaign);
      mockCampaignRepository.save.mockResolvedValue(campaign);

      const result = await service.create(createCampaignDto, currentUser);

      expect(result).toEqual(campaign);
    });
  });

  describe('findAll', () => {
    it('should return all campaigns for an admin', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const campaigns = [
        [{ id: 'campaign-1' }, { id: 'campaign-2' }],
        2,
      ] as [Campaign[], number];
      mockCampaignRepository.findAndCount.mockResolvedValue(campaigns);

      const result = await service.findAll(currentUser, paginationDto);

      expect(result.data).toEqual(campaigns[0]);
    });

    it('should return only business campaigns for a business user', async () => {
      const currentUser = {
        id: 'business-id',
        role: Role.Business,
      } as Business;
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const campaigns = [[{ id: 'campaign-1' }], 1] as [Campaign[], number];
      mockCampaignRepository.findAndCount.mockResolvedValue(campaigns);

      const result = await service.findAll(currentUser, paginationDto);

      expect(result.data).toEqual(campaigns[0]);
    });
  });

  describe('findOne', () => {
    it('should return a campaign for an admin', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: 'campaign-1',
        business: { id: 'business-id' },
      } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne('campaign-1', currentUser);

      expect(result).toEqual(campaign);
    });

    it('should return a campaign for the business owner', async () => {
      const currentUser = {
        id: 'business-id',
        role: Role.Business,
      } as Business;

      const campaign = {
        id: 'campaign-1',
        business: { id: 'business-id' },
      } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne('campaign-1', currentUser);

      expect(result).toEqual(campaign);
    });

    it('should throw an unauthorized exception for a non-owner business', async () => {
      const currentUser = {
        id: 'other-business-id',
        role: Role.Business,
      } as Business;

      const campaign = {
        id: 'campaign-1',
        business: { id: 'business-id' },
      } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      await expect(
        service.findOne('campaign-1', currentUser),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: 'campaign-1',
        business: { id: 'business-id' },
      } as Campaign;
      const updateCampaignDto = { name: 'Updated Campaign' };

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...campaign,
        ...updateCampaignDto,
      });

      const result = await service.update(
        'campaign-1',
        updateCampaignDto as any,
        currentUser,
      );

      expect(result.name).toEqual('Updated Campaign');
    });
  });

  describe('remove', () => {
    it('should remove a campaign', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: 'campaign-1',
        business: { id: 'business-id' },
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.remove.mockResolvedValue(undefined);

      await service.remove('campaign-1', currentUser);

      expect(mockCampaignRepository.remove).toHaveBeenCalledWith(campaign);
    });
  });

  describe('findOngoingCampaigns', () => {
    it('should return ongoing campaigns', async () => {
      const campaigns = [{ id: 'campaign-1' }] as Campaign[];
      mockCampaignRepository.find.mockResolvedValue(campaigns);

      const result = await service.findOngoingCampaigns();

      expect(result).toEqual(campaigns);
    });
  });

  describe('toggleCampaignStatus', () => {
    it('should toggle the campaign status', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = {
        id: 'campaign-1',
        business: { id: 'business-id' },
        disabled: false,
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...campaign,
        disabled: true,
      });

      const result = await service.toggleCampaignStatus(
        'campaign-1',
        currentUser,
      );

      expect(result.disabled).toEqual(true);
    });
  });
});
