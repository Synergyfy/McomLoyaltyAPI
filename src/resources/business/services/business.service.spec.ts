import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from './business.service';
import { Business } from '../entities/business.entity';
import { OnboardingDto } from '../dto/onboarding.dto';
import { HashService } from '../../../common/hash/hash.service';
import { NotFoundException } from '@nestjs/common';

describe('BusinessService', () => {
  let service: BusinessService;
  let repository: Repository<Business>;

  const mockBusinessRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockHashService = {
    hashPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        {
          provide: getRepositoryToken(Business),
          useValue: mockBusinessRepository,
        },
        {
          provide: HashService,
          useValue: mockHashService,
        },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
    repository = module.get<Repository<Business>>(getRepositoryToken(Business));
  });

  describe('onboarding', () => {
    it('should update a business with onboarding data', async () => {
      const businessId = 'some-uuid';
      const onboardingDto: OnboardingDto = {
        phone: '+1234567890',
        address: '123 Foodie Lane, Culinary City',
        sectorId: 'some-sector-uuid',
        referralCapacity: 10,
      };

      const existingBusiness = new Business();
      mockBusinessRepository.findOne.mockResolvedValue(existingBusiness);

      const { sectorId, ...rest } = onboardingDto;
      const expectedSaveObject = { ...existingBusiness, ...rest, sector: { id: sectorId } };
      mockBusinessRepository.save.mockResolvedValue(expectedSaveObject);

      const result = await service.onboarding(businessId, onboardingDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: businessId } });
      expect(repository.save).toHaveBeenCalledWith(expectedSaveObject);
      expect(result).toBeDefined();
    });

    it('should throw a NotFoundException if the business does not exist', async () => {
      const businessId = 'non-existent-uuid';
      const onboardingDto: OnboardingDto = {
        phone: '+1234567890',
        address: '123 Foodie Lane, Culinary City',
        sectorId: 'some-sector-uuid',
        referralCapacity: 10,
      };

      mockBusinessRepository.findOne.mockResolvedValue(null);

      await expect(service.onboarding(businessId, onboardingDto)).rejects.toThrow(NotFoundException);
    });
  });
});