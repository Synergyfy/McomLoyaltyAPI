import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Role } from '../src/common/role.enum';
import { UserRole } from '../src/common/enums/user-role.enum';
import * as jwt from 'jsonwebtoken';

describe('ReputationController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let businessToken: string;
  let participantToken: string;
  let businessId: string;
  let participantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    // Seed data or create users
    // Assuming seed has run or we create fresh

    // Create Business
    const business = await dataSource.getRepository('businesses').save({
        name: 'Reputation Test Business',
        email: `bizRep${Date.now()}@test.com`,
        password: 'password',
        uniqueCode: `UB${Date.now()}`,
        role: Role.Business,
        referralPoints: 0
    });
    businessId = business.id;
    businessToken = jwt.sign({ id: business.id, role: Role.Business, email: business.email }, process.env.JWT_SECRET || 'secret');

    // Create Participant
    const participant = await dataSource.getRepository('participants').save({
        name: 'Reputation Test Participant',
        email: `partRep${Date.now()}@test.com`,
        password: 'password',
        uniqueCode: `UP${Date.now()}`,
        role: UserRole.PARTICIPANT,
        global_total_points: 0
    });
    participantId = participant.id;
    participantToken = jwt.sign({ id: participant.id, role: UserRole.PARTICIPANT, email: participant.email }, process.env.JWT_SECRET || 'secret');

    // Create Admin
    const admin = await dataSource.getRepository('admins').save({
        name: 'Admin User',
        email: `adminRep${Date.now()}@test.com`,
        password: 'password',
        role: Role.Admin
    });
    adminToken = jwt.sign({ id: admin.id, role: Role.Admin, email: admin.email }, process.env.JWT_SECRET || 'secret');
  });

  afterAll(async () => {
    // Cleanup
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
        await queryRunner.query(`DELETE FROM reputation_logs WHERE "userId" IN ('${businessId}', '${participantId}')`);
        await queryRunner.query(`DELETE FROM businesses WHERE id = '${businessId}'`);
        await queryRunner.query(`DELETE FROM participants WHERE id = '${participantId}'`);
    } finally {
        await queryRunner.release();
        await app.close();
    }
  });

  it('/reputation/levels (GET)', () => {
    return request(app.getHttpServer())
      .get('/reputation/levels')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/reputation/my-status (GET) - Business Initial', () => {
    return request(app.getHttpServer())
      .get('/reputation/my-status')
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.currentLevel).toBeDefined();
        expect(res.body.currentLevel.name).toBe('Starter'); // Assuming seeded
        expect(res.body.points).toBe(0);
      });
  });

  it('/reputation/my-status (GET) - Participant Initial', () => {
    return request(app.getHttpServer())
      .get('/reputation/my-status')
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.currentLevel).toBeDefined();
        expect(res.body.currentLevel.name).toBe('Bronze'); // Assuming seeded
        expect(res.body.points).toBe(0);
      });
  });

  it('Admin Override', async () => {
    // Get levels to find a target level ID
    const levels = await dataSource.getRepository('reputation_levels').find();
    const silver = levels.find(l => l.name === 'Silver' && l.type === 'PARTICIPANT');

    await request(app.getHttpServer())
        .post('/reputation/admin/override')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            userId: participantId,
            userType: 'PARTICIPANT',
            levelId: silver.id,
            reason: 'E2E Test Override'
        })
        .expect(201);

    // Verify change
    return request(app.getHttpServer())
        .get('/reputation/my-status')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200)
        .expect((res) => {
            expect(res.body.currentLevel.name).toBe('Silver');
        });
  });
});
