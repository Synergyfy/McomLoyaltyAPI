import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Admin } from '../src/resources/admin/entities/admin.entity';
import { DataSource, Repository } from 'typeorm';
import { HashService } from '../src/common/hash/hash.service';

describe('AdminAnalyticsController (e2e)', () => {
  let app: INestApplication;
  let adminRepository: Repository<Admin>;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);
    adminRepository = moduleFixture.get<Repository<Admin>>(getRepositoryToken(Admin));
    await app.init();

    const hashService = app.get<HashService>(HashService);
    const hashedPassword = await hashService.hashPassword('password123');

    await adminRepository.save({
      name: 'Test Admin',
      email: 'admin-analytics-e2e@example.com',
      password: hashedPassword,
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin-analytics-e2e@example.com', password: 'password123' });
    adminToken = adminLoginResponse.body.access_token;
  });

  afterAll(async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
        await queryRunner.query('TRUNCATE TABLE "admins" RESTART IDENTITY CASCADE');
    } finally {
        await queryRunner.release();
    }
    await dataSource.destroy();
    await app.close();
  });

  it('/admin/analytics/growth-activity-chart (GET) - should return chart data', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/analytics/growth-activity-chart')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('labels');
    expect(response.body).toHaveProperty('registrations');
    expect(response.body).toHaveProperty('activities');
  });
});
