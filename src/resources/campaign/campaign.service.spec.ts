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

describe('CampaignService', () => {
  let service: CampaignService;
  let campaignRepository: Repository<Campaign>;
  let businessRepository: Repository<Business>;
  let rewardRepository: Repository<Reward>;

  const mockCampaignRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockBusinessRepository = {
    findOneBy: jest.fn(),
  };

  const mockRewardRepository = {
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
        description: 'Test Description',
        start_date: new Date(),
        end_date: new Date(),
        main_image: 'test.jpg',
        gallery: ['test.jpg'],
        reward_ids: ['reward-id'],
        business_id: 'business-id',
        text_color: '#000000',
        background_color: '#ffffff',
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
        description: 'Test Description',
        start_date: new Date(),
        end_date: new Date(),
        main_image: 'test.jpg',
        gallery: ['test.jpg'],
        reward_ids: ['reward-id'],
        business_id: 'business-id',
        text_color: '#000000',
        background_color: '#ffffff',
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

      const campaigns = [{ id: 'campaign-1' }, { id: 'campaign-2' }] as Campaign[];
      mockCampaignRepository.find.mockResolvedValue(campaigns);

      const result = await service.findAll(currentUser);

      expect(result).toEqual(campaigns);
    });

    it('should return only business campaigns for a business user', async () => {
      const currentUser = {
        id: 'business-id',
        role: Role.Business,
      } as Business;

      const campaigns = [{ id: 'campaign-1' }] as Campaign[];
      mockCampaignRepository.find.mockResolvedValue(campaigns);

      const result = await service.findAll(currentUser);

      expect(result).toEqual(campaigns);
    });
  });

  describe('findOne', () => {
    it('should return a campaign for an admin', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = { id: 'campaign-1', business: { id: 'business-id' } } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne('campaign-1', currentUser);

      expect(result).toEqual(campaign);
    });

    it('should return a campaign for the business owner', async () => {
      const currentUser = {
        id: 'business-id',
        role: Role.Business,
      } as Business;

      const campaign = { id: 'campaign-1', business: { id: 'business-id' } } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      const result = await service.findOne('campaign-1', currentUser);

      expect(result).toEqual(campaign);
    });

    it('should throw an unauthorized exception for a non-owner business', async () => {
      const currentUser = {
        id: 'other-business-id',
        role: Role.Business,
      } as Business;

      const campaign = { id: 'campaign-1', business: { id: 'business-id' } } as Campaign;
      mockCampaignRepository.findOne.mockResolvedValue(campaign);

      await expect(service.findOne('campaign-1', currentUser)).rejects.toThrow(
        'Unauthorized',
      );
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = { id: 'campaign-1', business: { id: 'business-id' } } as Campaign;
      const updateCampaignDto = { name: 'Updated Campaign' };

      mockCampaignRepository.findOne.mockResolvedValue(campaign);
      mockCampaignRepository.save.mockResolvedValue({ ...campaign, ...updateCampaignDto });

      const result = await service.update('campaign-1', updateCampaignDto, currentUser);

      expect(result.name).toEqual('Updated Campaign');
    });
  });

  describe('remove', () => {
    it('should remove a campaign', async () => {
      const currentUser = {
        id: 'admin-id',
        role: Role.Admin,
      } as Admin;

      const campaign = { id: 'campaign-1', business: { id: 'business-id' } } as Campaign;

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
      mockCampaignRepository.save.mockResolvedValue({ ...campaign, disabled: true });

      const result = await service.toggleCampaignStatus('campaign-1', currentUser);

      expect(result.disabled).toEqual(true);
    });
  });
});