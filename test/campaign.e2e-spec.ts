import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDatabase } from './test-utils';
import { CreateCampaignDto } from '../src/resources/campaign/dto/create-campaign.dto';
import {
  CampaignType,
  AudienceType,
} from '../src/resources/campaign/entities/campaign.entity';
import { Role } from '../src/common/role.enum';
import { CreateBusinessDto } from 'src/resources/business/dto/create-business.dto';

describe('CampaignController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let businessToken: string;
  let businessId: string;
  let rewardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(app);

    const adminResponse = await request(app.getHttpServer())
      .post('/admin/signup')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password',
        confirmPassword: 'password',
      });
    adminToken = adminResponse.body.accessToken;

    const businessResponse = await request(app.getHttpServer())
      .post('/business/signup')
      .send({
        name: 'Test Business',
        email: 'business@test.com',
        password: 'password',
        confirmPassword: 'password',
      });
    businessId = businessResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'business@test.com',
        password: 'password',
      });
    businessToken = loginResponse.body.access_token;

    const rewardResponse = await request(app.getHttpServer())
      .post('/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Reward',
        points_required: 100,
        value: 10,
        description: 'Test Reward Description',
        image: 'test.jpg',
        quantity: 10,
      });
    rewardId = rewardResponse.body.id;
  });

  it('/campaigns (POST)', async () => {
    const createCampaignDto: CreateCampaignDto = {
      name: 'Test Campaign',
      campaign_type: CampaignType.QR_CODE,
      campaign_message: 'Test Message',
      start_date: new Date(),
      end_date: new Date(),
      quantity: 10,
      audience_type: AudienceType.MEMBERS,
      banner_url: 'http://example.com/banner.jpg',
      cta_text: 'Click Me',
      cta_background_color: '#FFFFFF',
      cta_text_color: '#000000',
      text_color: '#000000',
      background_color: '#FFFFFF',
      reward_ids: [rewardId],
      business_id: businessId,
    };

    return request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${businessToken}`)
      .send(createCampaignDto)
      .expect(201);
  });

  it('/campaigns (GET)', async () => {
    return request(app.getHttpServer())
      .get('/campaigns')
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);
  });

  it('/campaigns/ongoing (GET)', async () => {
    return request(app.getHttpServer())
      .get('/campaigns/ongoing')
      .expect(200);
  });

  it('/campaigns/all/public (GET)', async () => {
    return request(app.getHttpServer())
      .get('/campaigns/all/public')
      .expect(200);
  });

  it('/campaigns/:id (GET)', async () => {
    const createCampaignDto: CreateCampaignDto = {
      name: 'Test Campaign',
      campaign_type: CampaignType.QR_CODE,
      campaign_message: 'Test Message',
      start_date: new Date(),
      end_date: new Date(),
      quantity: 10,
      audience_type: AudienceType.MEMBERS,
      banner_url: 'http://example.com/banner.jpg',
      cta_text: 'Click Me',
      cta_background_color: '#FFFFFF',
      cta_text_color: '#000000',
      text_color: '#000000',
      background_color: '#FFFFFF',
      reward_ids: [rewardId],
      business_id: businessId,
    };

    const response = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${businessToken}`)
      .send(createCampaignDto);

    return request(app.getHttpServer())
      .get(`/campaigns/${response.body.id}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);
  });

  it('/campaigns/:id (PATCH)', async () => {
    const createCampaignDto: CreateCampaignDto = {
      name: 'Test Campaign',
      campaign_type: CampaignType.QR_CODE,
      campaign_message: 'Test Message',
      start_date: new Date(),
      end_date: new Date(),
      quantity: 10,
      audience_type: AudienceType.MEMBERS,
      banner_url: 'http://example.com/banner.jpg',
      cta_text: 'Click Me',
      cta_background_color: '#FFFFFF',
      cta_text_color: '#000000',
      text_color: '#000000',
      background_color: '#FFFFFF',
      reward_ids: [rewardId],
      business_id: businessId,
    };

    const response = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${businessToken}`)
      .send(createCampaignDto);

    return request(app.getHttpServer())
      .patch(`/campaigns/${response.body.id}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({ name: 'Updated Campaign' })
      .expect(200);
  });

  it('/campaigns/:id (DELETE)', async () => {
    const createCampaignDto: CreateCampaignDto = {
      name: 'Test Campaign',
      campaign_type: CampaignType.QR_CODE,
      campaign_message: 'Test Message',
      start_date: new Date(),
      end_date: new Date(),
      quantity: 10,
      audience_type: AudienceType.MEMBERS,
      banner_url: 'http://example.com/banner.jpg',
      cta_text: 'Click Me',
      cta_background_color: '#FFFFFF',
      cta_text_color: '#000000',
      text_color: '#000000',
      background_color: '#FFFFFF',
      reward_ids: [rewardId],
      business_id: businessId,
    };

    const response = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${businessToken}`)
      .send(createCampaignDto);

    return request(app.getHttpServer())
      .delete(`/campaigns/${response.body.id}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);
  });

  it('/campaigns/:id/toggle (PATCH)', async () => {
    const createCampaignDto: CreateCampaignDto = {
      name: 'Test Campaign',
      campaign_type: CampaignType.QR_CODE,
      campaign_message: 'Test Message',
      start_date: new Date(),
      end_date: new Date(),
      quantity: 10,
      audience_type: AudienceType.MEMBERS,
      banner_url: 'http://example.com/banner.jpg',
      cta_text: 'Click Me',
      cta_background_color: '#FFFFFF',
      cta_text_color: '#000000',
      text_color: '#000000',
      background_color: '#FFFFFF',
      reward_ids: [rewardId],
      business_id: businessId,
    };

    const response = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${businessToken}`)
      .send(createCampaignDto);

    return request(app.getHttpServer())
      .patch(`/campaigns/${response.body.id}/toggle`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);
  });
});