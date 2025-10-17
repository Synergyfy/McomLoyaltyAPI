import { Test, TestingModule } from '@nestjs/testing';
import { SectorController } from './sector.controller';
import { SectorService } from '../services/sector.service';
import { CreateSectorDto } from '../dto/create-sector.dto';
import { JwtAuthGuard } from '../../admin/auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('SectorController', () => {
  let controller: SectorController;
  let service: SectorService;

  const mockSectorService = {
    create: jest.fn(dto => {
      return {
        id: '1',
        ...dto,
      };
    }),
  };

  const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: '1', email: 'admin@example.com' };
      return true;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectorController],
      providers: [
        {
          provide: SectorService,
          useValue: mockSectorService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .compile();

    controller = module.get<SectorController>(SectorController);
    service = module.get<SectorService>(SectorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sector', async () => {
      const createDto: CreateSectorDto = { name: 'Tech', imageUrl: 'http://example.com/image.png' };
      expect(await controller.create(createDto)).toEqual({
        id: '1',
        ...createDto,
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});