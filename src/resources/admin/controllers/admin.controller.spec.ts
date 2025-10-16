import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../auth/auth.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Admin } from '../entities/admin.entity';
import { HashService } from '../../../common/hash/hash.service';
import { BusinessService } from '../../business/services/business.service';
import { StaffService } from '../../staff/services/staff.service';

describe('AdminController', () => {
  let controller: AdminController;
  let authService: AuthService;

  const mockAdminRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBusinessService = {
    // mock methods if needed
  };

  const mockStaffService = {
    // mock methods if needed
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        AuthService,
        HashService,
        {
          provide: getRepositoryToken(Admin),
          useValue: mockAdminRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test_token'),
          },
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
        {
          provide: StaffService,
          useValue: mockStaffService,
        },
      ],
    })
    .overrideGuard(LocalAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AdminController>(AdminController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token when login is successful', async () => {
      const user = { id: '1', email: 'admin@example.com' };
      const req = { user };

      const result = await controller.login(req);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('test_token');
    });
  });
});