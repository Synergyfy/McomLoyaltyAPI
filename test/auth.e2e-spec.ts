import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Admin } from '../src/resources/admin/entities/admin.entity';
import { Repository } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let adminRepository: Repository<Admin>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    adminRepository = moduleFixture.get<Repository<Admin>>(getRepositoryToken(Admin));
    await app.init();
  });

  afterEach(async () => {
    await adminRepository.clear();
    await app.close();
  });

  it('/auth/login (POST)', async () => {
    await request(app.getHttpServer())
      .post('/admin/signup')
      .send({ email: 'admin@example.com', password: 'adminPassword123' });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'adminPassword123' })
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });
});