import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { Role } from "../src/common/role.enum";
import { Admin } from "../src/resources/admin/entities/admin.entity";
import { Business } from "../src/resources/business/entities/business.entity";
import { CreateCampaignDto } from "../src/resources/campaign/dto/create-campaign.dto";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Campaign } from "../src/resources/campaign/entities/campaign.entity";
import { Repository } from "typeorm";
import { AdminService } from "../src/resources/admin/admin.service";
import { BusinessService } from "../src/resources/business/business.service";
import { AuthService } from "../src/auth/auth.service";

describe("CampaignController (e2e)", () => {
  let app: INestApplication;
  let campaignRepository: Repository<Campaign>;
  let adminToken: string;
  let businessToken: string;
  let admin: Admin;
  let business: Business;
  let businessRepository: Repository<Business>;
  let adminRepository: Repository<Admin>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    campaignRepository = moduleFixture.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
    businessRepository = moduleFixture.get<Repository<Business>>(
      getRepositoryToken(Business),
    );
    adminRepository = moduleFixture.get<Repository<Admin>>(
      getRepositoryToken(Admin),
    );
    const adminService = moduleFixture.get<AdminService>(AdminService);
    const businessService = moduleFixture.get<BusinessService>(BusinessService);
    const authService = moduleFixture.get<AuthService>(AuthService);

    // Create admin user
    try {
      admin = await adminService.create({
        name: "Test Admin",
        email: "admin@example.com",
        password: "password",
        confirmPassword: "password",
      });
    } catch (error) {
      admin = await adminService.findOneByEmail("admin@example.com");
    }
    const adminLoginResult = await authService.login(admin);
    adminToken = adminLoginResult.access_token;

    // Create business user
    try {
      business = await businessService.create({
        name: "Test Business",
        email: "business@example.com",
        password: "password",
        confirmPassword: "password",
      });
    } catch (error) {
      business = await businessService.findOneByEmail("business@example.com");
    }
    const businessLoginResult = await authService.login(business);
    businessToken = businessLoginResult.access_token;
  });

  afterAll(async () => {
    await campaignRepository.delete({});
    await businessRepository.delete({});
    await adminRepository.delete({});
    await app.close();
  });

  describe("/campaigns (POST)", () => {
    it("should create a campaign for a business", () => {
      const createCampaignDto: CreateCampaignDto = {
        name: "Test Campaign",
        campaign_type: "qr_code" as any,
        campaign_message: "Test Message",
        start_date: new Date(),
        end_date: new Date(),
        quantity: 10,
        audience_type: "members" as any,
        banner_url: "http://test.jpg",
        cta_text: "Click Me",
        cta_background_color: "#000000",
        cta_text_color: "#ffffff",
        text_color: "#000000",
        background_color: "#ffffff",
        reward_ids: [],
      };

      return request(app.getHttpServer())
        .post("/campaigns")
        .set("Authorization", `Bearer ${businessToken}`)
        .send(createCampaignDto)
        .expect(201);
    });

    it("should create a campaign for an admin", () => {
      const createCampaignDto: any = {
        name: "Admin Campaign",
        campaign_type: "qr_code" as any,
        campaign_message: "Test Message",
        start_date: new Date(),
        end_date: new Date(),
        quantity: 10,
        audience_type: "members" as any,
        banner_url: "http://test.jpg",
        cta_text: "Click Me",
        cta_background_color: "#000000",
        cta_text_color: "#ffffff",
        text_color: "#000000",
        background_color: "#ffffff",
        reward_ids: [],
        business_id: business.id,
      };

      return request(app.getHttpServer())
        .post("/campaigns")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(createCampaignDto)
        .expect(201);
    });
  });

  describe("/campaigns (GET)", () => {
    it("should return campaigns for a business", () => {
      return request(app.getHttpServer())
        .get("/campaigns")
        .set("Authorization", `Bearer ${businessToken}`)
        .expect(200);
    });

    it("should return all campaigns for an admin", () => {
      return request(app.getHttpServer())
        .get("/campaigns")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe("/campaigns/admin (GET)", () => {
    it("should return admin-created campaigns for a business", () => {
      return request(app.getHttpServer())
        .get("/campaigns/admin")
        .set("Authorization", `Bearer ${businessToken}`)
        .expect(200);
    });
  });

  describe("/campaigns/business/:businessId (GET)", () => {
    it("should return campaigns for a specific business for an admin", () => {
      return request(app.getHttpServer())
        .get(`/campaigns/business/${business.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
