import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Business } from "../src/resources/business/entities/business.entity";
import { Staff } from "../src/resources/staff/entities/staff.entity";
import { Repository } from "typeorm";
import { Sector } from "../src/resources/sector/entities/sector.entity";
import { IsPasswordMatchingConstraint } from "../src/common/decorators/validation/is-password-matching.decorator";
import { Campaign } from "../src/resources/campaign/entities/campaign.entity";
import { Participant } from "../src/resources/participant/entities/participant.entity";
import { Point } from "../src/resources/point/entities/point.entity";
import { PointHistory } from "../src/resources/point/entities/point-history.entity";

describe("StaffController (e2e)", () => {
  let app: INestApplication;
  let businessRepository: Repository<Business>;
  let staffRepository: Repository<Staff>;
  let sectorRepository: Repository<Sector>;
  let campaignRepository: Repository<Campaign>;
  let participantRepository: Repository<Participant>;
  let pointRepository: Repository<Point>;
  let pointHistoryRepository: Repository<PointHistory>;
  let sector: Sector;
  let businessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [IsPasswordMatchingConstraint],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    businessRepository = moduleFixture.get<Repository<Business>>(
      getRepositoryToken(Business),
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
    pointRepository = moduleFixture.get<Repository<Point>>(
      getRepositoryToken(Point),
    );
    pointHistoryRepository = moduleFixture.get<Repository<PointHistory>>(
      getRepositoryToken(PointHistory),
    );
    await app.init();

    sector = await sectorRepository.save({ name: "Technology" });

    await request(app.getHttpServer()).post("/business/signup").send({
      name: "Test Business",
      email: "business@example.com",
      password: "businessPassword123",
      confirmPassword: "businessPassword123",
    });

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "business@example.com",
        password: "businessPassword123",
      });

    businessToken = loginResponse.body.access_token;

    await request(app.getHttpServer())
      .post("/business/onboarding")
      .set("Authorization", `Bearer ${businessToken}`)
      .send({
        phone: "1234567890",
        address: "123 Test St",
        sectorId: sector.id,
        referralCapacity: 10,
      });
  });

  afterEach(async () => {
    await pointHistoryRepository.delete({});
    await pointRepository.delete({});
    await participantRepository.delete({});
    await campaignRepository.delete({});
    await staffRepository.delete({});
    await businessRepository.delete({});
    await sectorRepository.delete({});
    await app.close();
  });

  it("/staff (POST) - success", async () => {
    return request(app.getHttpServer())
      .post("/staff")
      .set("Authorization", `Bearer ${businessToken}`)
      .send({
        name: "Test Staff",
        email: "staff@example.com",
        password: "staffPassword123",
        confirmPassword: "staffPassword123",
      })
      .expect(201);
  });

  it("/auth/login (POST) - staff login success", async () => {
    await request(app.getHttpServer())
      .post("/staff")
      .set("Authorization", `Bearer ${businessToken}`)
      .send({
        name: "Test Staff",
        email: "staff@example.com",
        password: "staffPassword123",
        confirmPassword: "staffPassword123",
      });

    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "staff@example.com", password: "staffPassword123" })
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty("user");
        expect(res.body.user).toHaveProperty("name", "Test Staff");
        expect(res.body.user).toHaveProperty("role", "Staff");
        expect(res.body).toHaveProperty("access_token");
        expect(res.body).toHaveProperty("refresh_token");
      });
  });
});
