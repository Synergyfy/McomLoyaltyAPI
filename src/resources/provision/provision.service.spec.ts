import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ProvisionService } from "./provision.service";
import { Provision, ProvisionType } from "./entities/provision.entity";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("ProvisionService", () => {
  let service: ProvisionService;
  let repository: Repository<Provision>;

  const mockProvisionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisionService,
        {
          provide: getRepositoryToken(Provision),
          useValue: mockProvisionRepository,
        },
      ],
    }).compile();

    service = module.get<ProvisionService>(ProvisionService);
    repository = module.get<Repository<Provision>>(getRepositoryToken(Provision));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create and save a new provision if it does not exist", async () => {
      const dto = {
        code: "TEST-CODE",
        type: ProvisionType.TIER_ACCESS,
        payload: { tierId: "123", durationDays: 30 },
        expiresAt: "2026-12-31",
      };

      mockProvisionRepository.findOne.mockResolvedValue(null);
      mockProvisionRepository.create.mockReturnValue(dto);
      mockProvisionRepository.save.mockResolvedValue(dto);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { code: dto.code } });
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ code: dto.code }));
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(dto);
    });

    it("should throw BadRequest if code exists and is redeemed", async () => {
      const dto = {
        code: "TEST-CODE",
        type: ProvisionType.TIER_ACCESS,
        payload: { tierId: "123", durationDays: 30 },
        expiresAt: "2026-12-31",
      };

      mockProvisionRepository.findOne.mockResolvedValue({ isRedeemed: true });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it("should return existing provision if code exists but not redeemed", async () => {
       const dto = {
        code: "TEST-CODE",
        type: ProvisionType.TIER_ACCESS,
        payload: { tierId: "123", durationDays: 30 },
        expiresAt: "2026-12-31",
      };
      const existing = { ...dto, isRedeemed: false };

      mockProvisionRepository.findOne.mockResolvedValue(existing);

      const result = await service.create(dto);
      expect(result).toEqual(existing);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe("validateAndMarkRedeemed", () => {
      it("should mark provision as redeemed if valid", async () => {
          const code = "VALID-CODE";
          const userId = "user-123";
          const provision = {
              code,
              isRedeemed: false,
              expiresAt: new Date(Date.now() + 100000), // Future date
              save: jest.fn()
          };

          mockProvisionRepository.findOne.mockResolvedValue(provision);
          mockProvisionRepository.save.mockImplementation((val) => val);

          const result = await service.validateAndMarkRedeemed(code, userId);

          expect(result.isRedeemed).toBe(true);
          expect(result.redeemedByUserId).toBe(userId);
          expect(result.redeemedAt).toBeDefined();
          expect(repository.save).toHaveBeenCalled();
      });

      it("should throw NotFoundException if code not found", async () => {
          mockProvisionRepository.findOne.mockResolvedValue(null);
          await expect(service.validateAndMarkRedeemed("INVALID", "user-1")).rejects.toThrow(NotFoundException);
      });

      it("should throw BadRequestException if already redeemed", async () => {
          mockProvisionRepository.findOne.mockResolvedValue({ isRedeemed: true });
          await expect(service.validateAndMarkRedeemed("REDEEMED", "user-1")).rejects.toThrow(BadRequestException);
      });

      it("should throw BadRequestException if expired", async () => {
          mockProvisionRepository.findOne.mockResolvedValue({ 
              isRedeemed: false, 
              expiresAt: new Date(Date.now() - 10000) 
          });
          await expect(service.validateAndMarkRedeemed("EXPIRED", "user-1")).rejects.toThrow(BadRequestException);
      });
  });
});
