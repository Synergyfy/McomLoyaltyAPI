import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Business } from "../src/resources/business/entities/business.entity";
import { Participant } from "../src/resources/participant/entities/participant.entity";
import { BusinessCampaign } from "../src/resources/campaign/entities/business-campaign.entity";
import {
  TransactionCode,
  TransactionCodeStatus,
  TransactionType,
} from "../src/resources/participant-campaign-balance/entities/transaction-code.entity";
import { DataSource, Repository } from "typeorm";
import { HashService } from "../src/common/hash/hash.service";
import { nanoid } from "nanoid";
import {
  CampaignType,
  AudienceType,
} from "../src/resources/campaign/entities/campaign-enums";

describe("ParticipantCampaignBalanceController (e2e)", () => {
  let app: INestApplication;
  let businessRepository: Repository<Business>;
  let participantRepository: Repository<Participant>;
  let businessCampaignRepository: Repository<BusinessCampaign>;
  let transactionCodeRepository: Repository<TransactionCode>;
  let dataSource: DataSource;
  let business: Business;
  let participant: Participant;
  let participantToken: string;
  let campaign: BusinessCampaign;
  let transactionCode: TransactionCode;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);
    businessRepository = moduleFixture.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
    participantRepository = moduleFixture.get<Repository<Participant>>(
      getRepositoryToken(Participant),
    );
    businessCampaignRepository = moduleFixture.get<
      Repository<BusinessCampaign>
    >(getRepositoryToken(BusinessCampaign));
    transactionCodeRepository = moduleFixture.get<Repository<TransactionCode>>(
      getRepositoryToken(TransactionCode),
    );
    await app.init();

    const hashService = app.get<HashService>(HashService);
    const hashedPassword = await hashService.hashPassword("password123");

    business = await businessRepository.save({
      name: "Test Business",
      email: "business-e2e@example.com",
      password: hashedPassword,
      uniqueCode: nanoid(9),
      affiliateCode: nanoid(9),
    });

    participant = await participantRepository.save({
      name: "Test Participant",
      email: "participant-e2e@example.com",
      password: hashedPassword,
      uniqueCode: nanoid(9),
    });

    const participantLoginResponse = await request(app.getHttpServer())
      .post("/participant/login")
      .send({ email: "participant-e2e@example.com", password: "password123" });
    participantToken = participantLoginResponse.body.access_token;

    campaign = await businessCampaignRepository.save({
      business: business,
      name: `E2E Test Campaign`,
      uniqueCode: nanoid(9),
      campaign_type: CampaignType.QR_CODE,
      start_date: new Date(),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
      audience_type: AudienceType.MEMBERS,
    });

    transactionCode = await transactionCodeRepository.save({
      code: nanoid(9),
      type: TransactionType.EARN,
      status: TransactionCodeStatus.ACTIVE,
      points: 100,
      businessCampaign: campaign,
      creator_business: business,
    });
  });

  afterAll(async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        'TRUNCATE TABLE "transaction_codes" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "business_campaigns" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "participants" RESTART IDENTITY CASCADE',
      );
      await queryRunner.query(
        'TRUNCATE TABLE "businesses" RESTART IDENTITY CASCADE',
      );
    } finally {
      await queryRunner.release();
    }
    await dataSource.destroy();
    await app.close();
  });

  it("/participant-campaign-balance/claim-code (POST) - should successfully claim a code", async () => {
    const response = await request(app.getHttpServer())
      .post("/participant-campaign-balance/claim-code")
      .set("Authorization", `Bearer ${participantToken}`)
      .send({
        code: transactionCode.code,
        campaignId: campaign.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Points awarded successfully",
    );
  });
});
