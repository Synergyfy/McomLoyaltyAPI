import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Admin } from "../src/resources/admin/entities/admin.entity";
import { Business } from "../src/resources/business/entities/business.entity";
import { Reward } from "../src/resources/rewards/entities/reward.entity";
import { BusinessReward } from "../src/resources/rewards/entities/business-reward.entity";
import { Staff } from "../src/resources/staff/entities/staff.entity";
import { DataSource, Repository } from "typeorm";
import { IsPasswordMatchingConstraint } from "../src/common/decorators/validation/is-password-matching.decorator";
import { Sector } from "../src/resources/sector/entities/sector.entity";
import { Campaign } from "../src/resources/campaign/entities/campaign.entity";
import { Participant } from "../src/resources/participant/entities/participant.entity";
import { HashService } from "../src/common/hash/hash.service";
import { RewardType } from "../src/resources/rewards/enums/reward-type.enum";
import { BadgeLevel } from "../src/resources/rewards/enums/badge-level.enum";
import { RewardSource } from "../src/resources/rewards/enums/reward-source.enum";
import { RewardAudience } from "../src/resources/rewards/enums/reward-audience.enum";
import { RewardStatus } from "../src/resources/rewards/enums/reward-status.enum";

describe("RewardsController (e2e)", () => {
  let app: INestApplication;
  let adminRepository: Repository<Admin>;
  let businessRepository: Repository<Business>;
  let rewardRepository: Repository<Reward>;
  let businessRewardRepository: Repository<BusinessReward>;
  let staffRepository: Repository<Staff>;
  let sectorRepository: Repository<Sector>;
  let campaignRepository: Repository<Campaign>;
  let participantRepository: Repository<Participant>;
  let sector: Sector;
  let adminToken: string;
  let businessToken: string;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [IsPasswordMatchingConstraint],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);
    adminRepository = moduleFixture.get<Repository<Admin>>(
      getRepositoryToken(Admin),
    );
    businessRepository = moduleFixture.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
    rewardRepository = moduleFixture.get<Repository<Reward>>(
      getRepositoryToken(Reward),
    );
    businessRewardRepository = moduleFixture.get<Repository<BusinessReward>>(
      getRepositoryToken(BusinessReward),
    );
    staffRepository = moduleFixture.get<Repository<Staff>>(
      getRepositoryToken(Staff),
    );
    sectorRepository = moduleFixture.get<Repository<Sector>>(
      getRepositoryToken(Sector),
    );
    campaignRepository = moduleFixture.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
    participantRepository = moduleFixture.get<Repository<Participant>>(
      getRepositoryToken(Participant),
    );
    await app.init();

    const hashService = moduleFixture.get<HashService>(HashService);
    const hashedPassword = await hashService.hashPassword("adminPassword123");

    await adminRepository.save({
      name: "Test Admin",
      email: "admin@example.com",
      password: hashedPassword,
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "adminPassword123" });
    adminToken = adminLoginResponse.body.access_token;

    sector = await sectorRepository.save({ name: "Technology" });
    await request(app.getHttpServer()).post("/business/signup").send({
      name: "Test Business",
      email: "business@example.com",
      password: "businessPassword123",
      confirmPassword: "businessPassword123",
    });
    const businessLoginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "business@example.com",
        password: "businessPassword123",
      });
    businessToken = businessLoginResponse.body.access_token;
  });

  afterEach(async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        'TRUNCATE TABLE "admins" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "businesses" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "sectors" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "staff" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "reward" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "business_reward" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "campaigns" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "participants" RESTART IDENTITY CASCADE',
      );
    } finally {
      await queryRunner.release();
    }
    await app.close();
  });

  it("/rewards/admin/rewards (POST) - should be protected", async () => {
    return request(app.getHttpServer())
      .post("/rewards/admin/rewards")
      .send({
        title: "Test Reward",
        points_required: 100,
        value: 10,
        description: "Test Description",
        image: "http://example.com/image.png",
        quantity: 10,
      })
      .expect(401);
  });

  it("/rewards/admin/rewards (POST) - should be accessible by admin", async () => {
    return request(app.getHttpServer())
      .post("/rewards/admin/rewards")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Reward",
        points_required: 100,
        value: 10,
        description: "Test Description",
        image: "http://example.com/image.png",
        quantity: 10,
        reward_type: RewardType.VOUCHER,
        badge_level: BadgeLevel.BRONZE,
        reward_source: RewardSource.MCOM_VAULT,
        audience: RewardAudience.ALL_BUSINESS,
      })
      .expect(201);
  });

  it("/rewards/business/unadded-rewards (GET) - should return all unadded rewards, ignoring sector and tier", async () => {
    // Create a reward available to a specific sector
    const sectorSpecificReward = await rewardRepository.save({
      title: "Sector Reward",
      points_required: 100,
      value: 50,
      description: "A reward for a specific sector",
      image: "image_url",
      quantity: 10,
      status: RewardStatus.ACTIVE,
      audience: RewardAudience.SPECIFIC_SECTORS,
      sectors: [sector],
      reward_type: RewardType.VOUCHER,
      badge_level: BadgeLevel.BRONZE,
      reward_source: RewardSource.MCOM_VAULT,
      disabled: false,
    });

    // Business (without a sector) logs in
    const response = await request(app.getHttpServer())
      .get("/rewards/business/unadded-rewards")
      .set("Authorization", `Bearer ${businessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(
      response.body.data.some((r) => r.id === sectorSpecificReward.id),
    ).toBe(true);
  });
});
