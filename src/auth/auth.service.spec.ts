import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { HashService } from '../common/hash/hash.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockHashService = {
    comparePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: HashService, useValue: mockHashService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if passwords match', async () => {
      const user = { email: 'test@test.com', password: 'hashedPassword' };
      mockUserService.findOne.mockResolvedValue(user);
      mockHashService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual({ email: 'test@test.com' });
    });

    it('should return null if passwords do not match', async () => {
      const user = { email: 'test@test.com', password: 'hashedPassword' };
      mockUserService.findOne.mockResolvedValue(user);
      mockHashService.comparePassword.mockResolvedValue(false);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });
  });
});