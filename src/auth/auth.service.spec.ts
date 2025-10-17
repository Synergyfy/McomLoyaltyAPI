import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { HashService } from '../common/hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../common/role.enum';

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
      const user = { email: 'test@test.com', password: 'hashedPassword', role: Role.Admin };
      mockUserService.findOne.mockResolvedValue(user);
      mockHashService.comparePassword.mockResolvedValue(true);

      const { password, ...expectedResult } = user;
      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException if passwords do not match', async () => {
      const user = { email: 'test@test.com', password: 'hashedPassword' };
      mockUserService.findOne.mockResolvedValue(user);
      mockHashService.comparePassword.mockResolvedValue(false);

      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { email: 'test@test.com', id: 'someId', role: Role.Admin };
      const token = 'someAccessToken';
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(user);
      expect(result).toEqual({ access_token: token });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: user.email,
        sub: user.id,
        role: user.role,
      });
    });
  });
});