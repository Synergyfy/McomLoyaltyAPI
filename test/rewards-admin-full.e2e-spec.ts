import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Admin } from '../src/resources/admin/entities/admin.entity';
import { Business } from '../src/resources/business/entities/business.entity';
import { Reward } from '../src/resources/rewards/entities/reward.entity';
import { BusinessReward } from '../src/resources/rewards/entities/business-reward.entity';
import { Staff } from '../src/resources/staff/entities/staff.entity';
import { Repository } from 'typeorm';
import { IsPasswordMatchingConstraint } from '../src/common/decorators/validation/is-password-matching.decorator';
import { Sector } from '../src/resources/sector/entities/sector.entity';
import { RewardImage } from '../src/resources/rewards/entities/reward-image.entity';

describe('RewardsController (e2e) - Admin Full', () => {
  let app: INestApplication;
  let adminRepository: Repository<Admin>;
  let businessRepository: Repository<Business>;
  let rewardRepository: Repository<Reward>;
  let businessRewardRepository: Repository<BusinessReward>;
  let staffRepository: Repository<Staff>;
  let sectorRepository: Repository<Sector>;
  let rewardImageRepository: Repository<RewardImage>;
  let adminToken: string;
  let rewardId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [IsPasswordMatchingConstraint],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    adminRepository = moduleFixture.get<Repository<Admin>>(getRepositoryToken(Admin));
    businessRepository = moduleFixture.get<Repository<Business>>(getRepositoryToken(Business));
    rewardRepository = moduleFixture.get<Repository<Reward>>(getRepositoryToken(Reward));
    businessRewardRepository = moduleFixture.get<Repository<BusinessReward>>(getRepositoryToken(BusinessReward));
    staffRepository = moduleFixture.get<Repository<Staff>>(getRepositoryToken(Staff));
    sectorRepository = moduleFixture.get<Repository<Sector>>(getRepositoryToken(Sector));
    rewardImageRepository = moduleFixture.get<Repository<RewardImage>>(getRepositoryToken(RewardImage));
    await app.init();

    await request(app.getHttpServer())
      .post('/admin/signup')
      .send({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'adminPassword123',
        confirmPassword: 'adminPassword123',
      });
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'adminPassword123' });
    adminToken = adminLoginResponse.body.access_token;

    const reward = await rewardRepository.save({
      title: 'Test Reward',
      points_required: 100,
      value: 10,
      description: 'Test Description',
      quantity: 10,
    });
    rewardId = reward.id;
  });

  afterEach(async () => {
    await businessRewardRepository.query('DELETE FROM business_reward;');
    await rewardImageRepository.query('DELETE FROM reward_images;');
    await rewardRepository.query('DELETE FROM reward;');
    await staffRepository.query('DELETE FROM staff;');
    await businessRepository.query('DELETE FROM businesses;');
    await sectorRepository.query('DELETE FROM sectors;');
    await adminRepository.query('DELETE FROM admins;');
    await app.close();
  });

  it('/rewards/admin/rewards (POST) - should create a reward with multiple images', async () => {
    return request(app.getHttpServer())
      .post('/rewards/admin/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Reward 2',
        points_required: 100,
        value: 10,
        description: 'Test Description 2',
        quantity: 10,
        images: ['http://example.com/image1.png', 'http://example.com/image2.png'],
      })
      .expect(201)
      .then((res) => {
        expect(res.body.images).toHaveLength(2);
      });
  });

  it('/rewards/admin/rewards/:id (PUT) - should update a reward with new images', async () => {
    return request(app.getHttpServer())
      .put(`/rewards/admin/rewards/${rewardId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        images: ['http://example.com/image3.png', 'http://example.com/image4.png'],
      })
      .expect(200)
      .then((res) => {
        expect(res.body.images).toHaveLength(2);
      });
  });

  it('/rewards/admin/rewards/:id/disable (POST) - should disable a reward', async () => {
    return request(app.getHttpServer())
      .post(`/rewards/admin/rewards/${rewardId}/disable`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .then((res) => {
        expect(res.body.disabled).toBe(true);
      });
  });

  it('/rewards/admin/rewards/:id/enable (POST) - should enable a reward', async () => {
    return request(app.getHttpServer())
      .post(`/rewards/admin/rewards/${rewardId}/enable`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .then((res) => {
        expect(res.body.disabled).toBe(false);
      });
  });

  it('/rewards/admin/rewards/:id (DELETE) - should delete a reward', async () => {
    return request(app.getHttpServer())
      .delete(`/rewards/admin/rewards/${rewardId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
