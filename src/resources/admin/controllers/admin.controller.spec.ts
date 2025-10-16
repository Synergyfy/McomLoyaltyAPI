import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Admin } from '../entities/admin.entity';
import { HashService } from '../../../common/hash/hash.service';
import { BusinessService } from '../../business/services/business.service';
import { StaffService } from '../../staff/services/staff.service';
import { LoginAdminDto } from '../dto/login-admin.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let authService: AuthService;
  let adminService: AdminService;

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
    }).compile();

    controller = module.get<AdminController>(AdminController);
    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token and refresh token when login is successful', async () => {
      const loginDto: LoginAdminDto = { email: 'admin@example.com', password: 'password' };
      const result = { access_token: 'test_token', refresh_token: 'test_token' };
      jest.spyOn(authService, 'login').mockImplementation(async () => result);

      expect(await controller.login(loginDto)).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new admin', async () => {
      const createDto: CreateAdminDto = { email: 'new@admin.com', password: 'password', confirmPassword: 'password' };
      const createdAdmin = new Admin();
      jest.spyOn(adminService, 'create').mockImplementation(async () => createdAdmin);

      expect(await controller.create(createDto)).toBe(createdAdmin);
    });
  });
});