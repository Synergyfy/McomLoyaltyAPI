import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { VoucherService } from './voucher.service';
import { Voucher } from './entities/voucher.entity';
import { ParticipantCampaignBalanceService } from '../participant-campaign-balance/services/participant-campaign-balance.service';
import { User } from 'src/common/interfaces/user.interface';
import { Role } from 'src/common/role.enum';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { VoucherType } from './entities/voucher-type.enum';
import { VoucherValueType } from './entities/voucher-value-type.enum';
import { VoucherStatus } from './entities/voucher-status.enum';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

const mockVoucherRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
  findAndCount: jest.fn(),
};

const mockParticipantCampaignBalanceService = {
  findOneByParticipantAndCampaign: jest.fn(),
  decrement: jest.fn(),
};

const mockEntityManager = {
  transaction: jest.fn().mockImplementation(async (callback) => {
    const transactionalEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    return callback(transactionalEntityManager);
  }),
};

describe('VoucherService', () => {
  let service: VoucherService;
  let repository: Repository<Voucher>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherService,
        {
          provide: getRepositoryToken(Voucher),
          useValue: mockVoucherRepository,
        },
        {
          provide: ParticipantCampaignBalanceService,
          useValue: mockParticipantCampaignBalanceService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<VoucherService>(VoucherService);
    repository = module.get<Repository<Voucher>>(getRepositoryToken(Voucher));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new voucher', async () => {
      const createVoucherDto: CreateVoucherDto = {
        title: 'Test Voucher',
        type: VoucherType.ITEM,
        valueCost: 100,
        valueType: VoucherValueType.POINTS,
        expiryDate: new Date(),
        totalQuantity: 10,
        redemptionRules: 'Test Rules',
      };
      const user: User = { id: 'user-id', role: Role.Business };
      const voucher = new Voucher();

      mockVoucherRepository.create.mockReturnValue(voucher);
      mockVoucherRepository.save.mockResolvedValue(voucher);

      const result = await service.create(createVoucherDto, user);

      expect(mockVoucherRepository.create).toHaveBeenCalledWith({
        ...createVoucherDto,
        creatorId: user.id,
        creatorType: user.role,
      });
      expect(mockVoucherRepository.save).toHaveBeenCalledWith(voucher);
      expect(result).toEqual(voucher);
    });
  });

  describe('findAll', () => {
    it('should return paginated vouchers for an admin', async () => {
      const user: User = { id: 'admin-id', role: Role.Admin };
      const vouchers = [new Voucher(), new Voucher()];
      mockVoucherRepository.findAndCount.mockResolvedValue([vouchers, 2]);

      const result = await service.findAll(user, { page: 1, limit: 10 });

      expect(mockVoucherRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(vouchers);
    });

    it('should return paginated vouchers for a business', async () => {
      const user: User = { id: 'business-id', role: Role.Business };
      const vouchers = [new Voucher()];
      mockVoucherRepository.findAndCount.mockResolvedValue([vouchers, 1]);

      const result = await service.findAll(user, { page: 1, limit: 10 });

      expect(mockVoucherRepository.findAndCount).toHaveBeenCalledWith({ where: { creatorId: user.id }, skip: 0, take: 10 });
      expect(result.data).toEqual(vouchers);
    });
  });

  describe('findOne', () => {
    it('should find and return a voucher by ID for an admin', async () => {
      const user: User = { id: 'admin-id', role: Role.Admin };
      const voucher = new Voucher();
      mockVoucherRepository.findOne.mockResolvedValue(voucher);

      const result = await service.findOne('voucher-id', user);

      expect(mockVoucherRepository.findOne).toHaveBeenCalledWith({ where: { id: 'voucher-id' } });
      expect(result).toEqual(voucher);
    });

    it('should find and return a voucher by ID for the business owner', async () => {
      const user: User = { id: 'business-id', role: Role.Business };
      const voucher = new Voucher();
      voucher.creatorId = user.id;
      mockVoucherRepository.findOne.mockResolvedValue(voucher);

      const result = await service.findOne('voucher-id', user);

      expect(result).toEqual(voucher);
    });

    it('should throw ForbiddenException if a business tries to access another business voucher', async () => {
      const user: User = { id: 'business-id', role: Role.Business };
      const voucher = new Voucher();
      voucher.creatorId = 'other-business-id';
      mockVoucherRepository.findOne.mockResolvedValue(voucher);

      await expect(service.findOne('voucher-id', user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if voucher not found', async () => {
      const user: User = { id: 'admin-id', role: Role.Admin };
      mockVoucherRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('voucher-id', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a voucher', async () => {
      const user: User = { id: 'business-id', role: Role.Business };
      const voucher = new Voucher();
      voucher.creatorId = user.id;
      const updateVoucherDto: UpdateVoucherDto = { title: 'Updated Title' };

      mockVoucherRepository.findOne.mockResolvedValue(voucher);
      mockVoucherRepository.merge.mockReturnValue({ ...voucher, ...updateVoucherDto });
      mockVoucherRepository.save.mockResolvedValue({ ...voucher, ...updateVoucherDto });

      const result = await service.update('voucher-id', updateVoucherDto, user);

      expect(result.title).toEqual('Updated Title');
    });
  });

  describe('remove', () => {
    it('should remove a voucher', async () => {
      const user: User = { id: 'business-id', role: Role.Business };
      const voucher = new Voucher();
      voucher.creatorId = user.id;

      mockVoucherRepository.findOne.mockResolvedValue(voucher);
      mockVoucherRepository.delete.mockResolvedValue(undefined);

      await service.remove('voucher-id', user);

      expect(mockVoucherRepository.delete).toHaveBeenCalledWith('voucher-id');
    });
  });

  describe('redeem', () => {
    // This is a simplified test for the redeem method. A full test would require more setup.
    it('should throw BadRequestException if voucher is not active', async () => {
      const voucher = new Voucher();
      voucher.expiryDate = new Date('2020-01-01');
      voucher.updateStatus();

      const transactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(voucher),
        save: jest.fn(),
      };

      mockEntityManager.transaction.mockImplementation(async (callback) => {
        return callback(transactionalEntityManager);
      });

      await expect(service.redeem('voucher-id', 'participant-id', 'campaign-id')).rejects.toThrow(BadRequestException);
    });
  });
});
