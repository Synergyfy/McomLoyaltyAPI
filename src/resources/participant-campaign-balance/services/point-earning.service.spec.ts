import { Test, TestingModule } from '@nestjs/testing';
import { PointEarningService } from './point-earning.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Participant } from '../../participant/entities/participant.entity';
import { ParticipantCampaignBalance } from '../entities/participant-campaign-balance.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { PointHistory } from '../entities/point-history.entity';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('PointEarningService', () => {
  let service: PointEarningService;
  let campaignRepository: Repository<Campaign>;

  const mockStaffRepository = {
    findOne: jest.fn(),
  };
  const mockParticipantRepository = {
    findOne: jest.fn(),
  };
  const mockParticipantCampaignBalanceRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const mockCampaignRepository = {
    findOne: jest.fn(),
  };
  const mockPointHistoryRepository = {
    create: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn().mockImplementation((callback) =>
      callback({
        findOne: jest.fn(),
        save: jest.fn(),
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointEarningService,
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepository,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(ParticipantCampaignBalance),
          useValue: mockParticipantCampaignBalanceRepository,
        },
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(PointHistory),
          useValue: mockPointHistoryRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PointEarningService>(PointEarningService);
    campaignRepository = module.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('awardPoints', () => {
    it('should throw BadRequestException if regular points threshold is reached', async () => {
      const campaign = {
        id: 'campaign-id',
        reward_type: 'regular',
        regular_points_threshold: 100,
        total_points_earned: 100,
      };
      mockDataSource.transaction.mockImplementation((callback) =>
        callback({
          findOne: jest.fn().mockResolvedValue(campaign),
          save: jest.fn(),
        }),
      );

      await expect(
        service.awardPoints('staff-id', 'participant-id', 'campaign-id', 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if matching points threshold is reached', async () => {
      const campaign = {
        id: 'campaign-id',
        reward_type: 'matching',
        matching_points_threshold: 100,
        total_matching_points_earned: 100,
      };
      mockDataSource.transaction.mockImplementation((callback) =>
        callback({
          findOne: jest.fn().mockResolvedValue(campaign),
          save: jest.fn(),
        }),
      );

      await expect(
        service.awardPoints('staff-id', 'participant-id', 'campaign-id', 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if matching points are disabled by admin', async () => {
      const campaign = {
        id: 'campaign-id',
        reward_type: 'matching',
        matching_points_disabled_by_admin: true,
      };
      mockDataSource.transaction.mockImplementation((callback) =>
        callback({
          findOne: jest.fn().mockResolvedValue(campaign),
          save: jest.fn(),
        }),
      );

      await expect(
        service.awardPoints('staff-id', 'participant-id', 'campaign-id', 10),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
