import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaqueService } from './plaque.service';
import { BusinessService } from '../business/services/business.service';
import { GroupService } from '../group/group.service';
import { Plaque } from './entities/plaque.entity';
import { ScanEvent } from './entities/scan-event.entity';
import { Business } from '../business/entities/business.entity';
import { AssignPlaqueDto } from './dto/assign-plaque.dto';
import { TransferPlaqueDto } from './dto/transfer-plaque.dto';
import { CreateScanEventDto } from './dto/create-scan-event.dto';
import { PlaqueStatus } from './entities/enums/plaque-status.enum';
import { PlaqueRole } from './entities/enums/plaque-role.enum';

describe('PlaqueService', () => {
  let service: PlaqueService;
  let plaqueRepository: Repository<Plaque>;
  let scanEventRepository: Repository<ScanEvent>;
  let businessService: BusinessService;
  let groupService: GroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaqueService,
        {
          provide: getRepositoryToken(Plaque),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ScanEvent),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: BusinessService,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            findById: jest.fn(),
            invitePartner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlaqueService>(PlaqueService);
    plaqueRepository = module.get<Repository<Plaque>>(getRepositoryToken(Plaque));
    scanEventRepository = module.get<Repository<ScanEvent>>(
      getRepositoryToken(ScanEvent),
    );
    businessService = module.get<BusinessService>(BusinessService);
    groupService = module.get<GroupService>(GroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPlaque', () => {
    it('should create a new plaque', async () => {
      const createPlaqueDto: CreatePlaqueDto = {
        group_id: 'group-id',
      };
      const owner = new Business();
      owner.id = 'owner-id';
      const group = new Group();
      group.id = 'group-id';

      (businessService.findById as jest.Mock).mockResolvedValue(owner);
      (groupService.findById as jest.Mock).mockResolvedValue(group);
      (plaqueRepository.create as jest.Mock).mockReturnValue({} as Plaque);
      (plaqueRepository.save as jest.Mock).mockResolvedValue({} as Plaque);

      const result = await service.createPlaque(createPlaqueDto);

      expect(result).toBeDefined();
      expect(businessService.findById).toHaveBeenCalledWith('owner-id');
      expect(groupService.findById).toHaveBeenCalledWith('group-id');
      expect(plaqueRepository.create).toHaveBeenCalled();
      expect(plaqueRepository.save).toHaveBeenCalled();
    });
  });

  describe('assignPlaque', () => {
    it('should assign a plaque to a partner', async () => {
      const plaqueId = 'plaque-id';
      const ownerId = 'owner-id';
      const assignPlaqueDto: AssignPlaqueDto = {
        partner_business_name: 'Partner',
        partner_contact_name: 'Contact',
        partner_contact_email: 'partner@example.com',
        partner_location_address: 'Address',
        plaque_role: PlaqueRole.RESELLER,
      };
      const plaque = new Plaque();
      plaque.id = plaqueId;
      const group = new Group();
      group.id = 'group-id';
      plaque.group = group;
      const partner = new Business();
      partner.id = 'partner-id';
      partner.email = 'partner@example.com';

      (plaqueRepository.findOne as jest.Mock).mockResolvedValue(plaque);
      (businessService.findByEmail as jest.Mock).mockResolvedValue(partner);
      (groupService.invitePartner as jest.Mock).mockResolvedValue({} as GroupMembership);
      (plaqueRepository.save as jest.Mock).mockResolvedValue(plaque);

      const result = await service.assignPlaque(plaqueId, assignPlaqueDto, ownerId);

      expect(result).toBeDefined();
      expect(groupService.invitePartner).toHaveBeenCalledWith(
        'group-id',
        {
          partner_email: 'partner@example.com',
          role: 'member',
        },
        ownerId,
      );
      expect(result.status).toEqual(PlaqueStatus.ASSIGNED);
      expect(result.metadata.partner_details).toEqual(assignPlaqueDto);
      expect(plaqueRepository.findOne).toHaveBeenCalledWith({
        where: { id: plaqueId, current_owner: { id: ownerId } },
      });
      expect(plaqueRepository.save).toHaveBeenCalledWith(plaque);
    });
  });

  describe('markForSale', () => {
    it('should mark a plaque for sale', async () => {
      const plaqueId = 'plaque-id';
      const ownerId = 'owner-id';
      const markForSaleDto = { price: 150 };
      const plaque = new Plaque();
      plaque.id = plaqueId;

      (plaqueRepository.findOne as jest.Mock).mockResolvedValue(plaque);
      (plaqueRepository.save as jest.Mock).mockResolvedValue(plaque);

      const result = await service.markForSale(
        plaqueId,
        markForSaleDto,
        ownerId,
      );

      expect(result).toBeDefined();
      expect(result.status).toEqual(PlaqueStatus.FOR_SALE);
      expect(result.price).toEqual(150);
      expect(plaqueRepository.findOne).toHaveBeenCalledWith({
        where: { id: plaqueId, current_owner: { id: ownerId } },
      });
      expect(plaqueRepository.save).toHaveBeenCalledWith(plaque);
    });
  });

  describe('transferPlaque', () => {
    it('should transfer a plaque to a new owner', async () => {
      const plaqueId = 'plaque-id';
      const sellerId = 'seller-id';
      const transferPlaqueDto: TransferPlaqueDto = {
        to_owner_id: 'buyer-id',
        price: 100,
      };
      const plaque = new Plaque();
      plaque.id = plaqueId;
      const buyer = new Business();
      buyer.id = 'buyer-id';
      const seller = new Business();
      seller.id = sellerId;

      (plaqueRepository.findOne as jest.Mock).mockResolvedValue(plaque);
      (businessService.findById as jest.Mock).mockImplementation((id) => {
        if (id === 'buyer-id') return Promise.resolve(buyer);
        if (id === sellerId) return Promise.resolve(seller);
        return Promise.resolve(null);
      });
      (plaqueRepository.save as jest.Mock).mockResolvedValue(plaque);

      const result = await service.transferPlaque(plaqueId, transferPlaqueDto, sellerId);

      expect(result).toBeDefined();
      expect(result.status).toEqual(PlaqueStatus.TRANSFERRED);
      expect(result.current_owner).toEqual(buyer);
      expect(result.last_seller).toEqual(seller);
      expect(result.original_seller).toEqual(seller);
      expect(plaqueRepository.findOne).toHaveBeenCalledWith({
        where: { id: plaqueId, current_owner: { id: sellerId } },
      });
      expect(plaqueRepository.save).toHaveBeenCalledWith(plaque);
    });
  });

  describe('createScanEvent', () => {
    it('should create a scan event and increment the plaque scan count', async () => {
      const createScanEventDto: CreateScanEventDto = {
        plaque_id: 'plaque-id',
      };
      const plaque = new Plaque();
      plaque.id = 'plaque-id';
      plaque.scan_count = 0;

      (plaqueRepository.findOne as jest.Mock).mockResolvedValue(plaque);
      (plaqueRepository.save as jest.Mock).mockResolvedValue(plaque);
      (scanEventRepository.create as jest.Mock).mockReturnValue({
        plaque,
      } as ScanEvent);
      (scanEventRepository.save as jest.Mock).mockResolvedValue({} as ScanEvent);

      const result = await service.createScanEvent(createScanEventDto);

      expect(result).toBeDefined();
      expect(plaque.scan_count).toEqual(1);
      expect(plaqueRepository.findOne).toHaveBeenCalledWith({
        where: { id: createScanEventDto.plaque_id },
      });
      expect(plaqueRepository.save).toHaveBeenCalledWith(plaque);
      expect(scanEventRepository.create).toHaveBeenCalledWith({
        ...createScanEventDto,
        plaque,
      });
      expect(scanEventRepository.save).toHaveBeenCalled();
    });
  });
});
