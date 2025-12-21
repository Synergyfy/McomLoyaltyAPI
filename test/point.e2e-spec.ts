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
import {
  CampaignType,
  AudienceType,
} from "../src/resources/campaign/entities/campaign-enums";
import { Participant } from "../src/resources/participant/entities/participant.entity";
import { Point } from "../src/resources/point/entities/point.entity";
import { PointHistory } from "../src/resources/point/entities/point-history.entity";
import { CreateCampaignDto } from "src/resources/campaign/dto/create-campaign.dto";

describe("PointController (e2e)", () => {
  let app: INestApplication;
  let businessRepository: Repository<Business>;
  let staffRepository: Repository<Staff>;
  let sectorRepository: Repository<Sector>;
  let campaignRepository: Repository<Campaign>;
  let participantRepository: Repository<Participant>;
  let pointRepository: Repository<Point>;
  let pointHistoryRepository: Repository<PointHistory>;
  let sector: Sector;
  let business: Business;
  let campaign: Campaign;
  let participant: Participant;
  let businessToken: string;
  let participantToken: string;

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
    const businessLoginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "business@example.com",
        password: "businessPassword123",
      });
    businessToken = businessLoginResponse.body.access_token;
    business = businessLoginResponse.body.user;

    const createCampaignDto: CreateCampaignDto = {
      name: "Test Campaign",
      campaign_type: CampaignType.QR_CODE,
      campaign_message: "Test Message",
      start_date: new Date(),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      quantity: 100,
      audience_type: AudienceType.MEMBERS,
      banner_url: "http://example.com/banner.png",
      logo_url: "http://example.com/logo.png",
      cta_text: "Click Me",
      cta_background_color: "#FFFFFF",
      cta_text_color: "#000000",
      text_color: "#000000",
      background_color: "#FFFFFF",
      reward_ids: [],
    };
    const campaignResponse = await request(app.getHttpServer())
      .post("/campaigns")
      .set("Authorization", `Bearer ${businessToken}`)
      .send(createCampaignDto);
    campaign = campaignResponse.body;

    const participantSignupResponse = await request(app.getHttpServer())
      .post("/participant/signup")
      .send({
        name: "Test Participant",
        email: "participant@example.com",
        password: "participantPassword123",
        confirmPassword: "participantPassword123",
        campaignId: campaign.id,
      });
    participantToken = participantSignupResponse.body.access_token;
    participant = await participantRepository.findOne({
      where: { email: "participant@example.com" },
    });
  });

  afterEach(async () => {
    await pointHistoryRepository.delete({});
    await pointRepository.delete({});
    await participantRepository.query(
      "DELETE FROM participants_campaigns_campaigns;",
    );
    await participantRepository.delete({});
    await campaignRepository.delete({});
    await staffRepository.delete({});
    await businessRepository.delete({});
    await sectorRepository.delete({});
    await app.close();
  });

  it("/point/participant/code (GET) - success", async () => {
    return request(app.getHttpServer())
      .get("/point/participant/code")
      .set("Authorization", `Bearer ${participantToken}`)
      .expect(200)
      .then((res) => {
        expect(res.text).toHaveLength(9);
      });
  });

  it("/point/business/generate-code (POST) - success", async () => {
    return request(app.getHttpServer())
      .post("/point/business/generate-code")
      .set("Authorization", `Bearer ${businessToken}`)
      .expect(201)
      .then((res) => {
        expect(res.text).toHaveLength(9);
      });
  });

  it("/point/award (POST) - success", async () => {
    return request(app.getHttpServer())
      .post("/point/award")
      .set("Authorization", `Bearer ${businessToken}`)
      .send({
        code: participant.uniqueCode,
        points: 100,
        campaignId: campaign.id,
      })
      .expect(201);
  });

  it("/point/business/participants (GET) - success", async () => {
    return request(app.getHttpServer())
      .get("/point/business/participants")
      .set("Authorization", `Bearer ${businessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.data[0].id).toBe(participant.id);
      });
  });

  it("/point/business/participants/:participantId (GET) - success", async () => {
    await request(app.getHttpServer())
      .post("/point/award")
      .set("Authorization", `Bearer ${businessToken}`)
      .send({
        code: participant.uniqueCode,
        points: 100,
        campaignId: campaign.id,
      });

    return request(app.getHttpServer())
      .get(`/point/business/participants/${participant.id}`)
      .set("Authorization", `Bearer ${businessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.balance).toBe(100);
        expect(res.body.history[0].points).toBe(100);
      });
  });
});
