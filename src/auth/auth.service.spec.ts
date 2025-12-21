import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UserService } from "../user/user.service";
import { HashService } from "../common/hash/hash.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { Role } from "../common/role.enum";
import { OtpService } from "../resources/otp/otp.service";
import { MailService } from "../mail/mail.service";
import { BusinessService } from "../resources/business/services/business.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Membership } from "../resources/membership/entities/membership.entity";

describe("AuthService", () => {
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

  const mockOtpService = {
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockMailService = {
    sendOtp: jest.fn(),
  };

  const mockBusinessService = {
    findById: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: HashService, useValue: mockHashService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MailService, useValue: mockMailService },
        { provide: BusinessService, useValue: mockBusinessService },
        {
          provide: getRepositoryToken(Membership),
          useValue: mockMembershipRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user if passwords match", async () => {
      const user = {
        email: "test@test.com",
        password: "hashedPassword",
        role: Role.Admin,
      };
      mockUserService.findOne.mockResolvedValue(user);
      mockHashService.comparePassword.mockResolvedValue(true);

      const { password, ...expectedResult } = user;
      const result = await service.validateUser("test@test.com", "password");
      expect(result).toEqual(expectedResult);
    });

    it("should throw UnauthorizedException if passwords do not match", async () => {
      const user = { email: "test@test.com", password: "hashedPassword" };
      mockUserService.findOne.mockResolvedValue(user);
      mockHashService.comparePassword.mockResolvedValue(false);

      await expect(
        service.validateUser("test@test.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser("test@test.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("login", () => {
    it("should return user, access token, and refresh token", async () => {
      const user = {
        name: "Test User",
        email: "test@test.com",
        id: "someId",
        role: Role.Admin,
      };
      const accessToken = "someAccessToken";
      const refreshToken = "someRefreshToken";
      mockJwtService.sign.mockImplementation((payload, options) => {
        if (options?.expiresIn === "7d") {
          return refreshToken;
        }
        return accessToken;
      });

      const result = await service.login(user);
      expect(result).toEqual({
        user: {
          name: user.name,
          role: user.role,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    });

    it("should return isOnboarded for business users", async () => {
      const user = {
        name: "Test User",
        email: "test@test.com",
        id: "someId",
        role: Role.Business,
      };
      const accessToken = "someAccessToken";
      const refreshToken = "someRefreshToken";
      mockJwtService.sign.mockImplementation((payload, options) => {
        if (options?.expiresIn === "7d") {
          return refreshToken;
        }
        return accessToken;
      });
      mockBusinessService.findById.mockResolvedValue({ sector: {} });

      mockMembershipRepository.findOne.mockResolvedValue(null);

      const result = await service.login(user);
      expect(result).toEqual({
        user: {
          name: user.name,
          role: user.role,
          isOnboarded: true,
          subscription: {
            isActive: false,
            isTrial: false,
          },
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    });
  });
});
