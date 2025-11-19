import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { VoucherType } from 'src/resources/voucher/entities/voucher-type.enum';
import { VoucherValueType } from 'src/resources/voucher/entities/voucher-value-type.enum';
import { CreateVoucherDto } from 'src/resources/voucher/dto/create-voucher.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Business } from 'src/resources/business/entities/business.entity';
import { Admin } from 'src/resources/admin/entities/admin.entity';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/role.enum';

describe('VoucherController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let businessToken: string;
  let businessId: string;
  let voucherId: string;

  const generateToken = (payload: any) => {
    const jwtService = app.get(JwtService);
    return jwtService.sign(payload);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const businessRepository = moduleFixture.get(getRepositoryToken(Business));
    const business = await businessRepository.save({ name: 'Test Business', email: 'business-e2e@test.com', password: 'password' });
    businessId = business.id;

    adminToken = generateToken({ id: 'admin-id', role: Role.Admin });
    businessToken = generateToken({ id: businessId, role: Role.Business });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/vouchers (POST) - should create a voucher for a business', () => {
    const createVoucherDto: CreateVoucherDto = {
      title: 'Business Test Voucher',
      type: VoucherType.ITEM,
      valueCost: 1000,
      valueType: VoucherValueType.POINTS,
      expiryDate: new Date('2025-12-31'),
      totalQuantity: 50,
      redemptionRules: 'Business only',
    };

    return request(app.getHttpServer())
      .post('/vouchers')
      .set('Authorization', `Bearer ${businessToken}`)
      .send(createVoucherDto)
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toEqual(createVoucherDto.title);
        voucherId = res.body.id;
      });
  });

  it('/vouchers (GET) - business should get only their own vouchers', () => {
    return request(app.getHttpServer())
      .get('/vouchers')
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].id).toEqual(voucherId);
      });
  });

  it('/vouchers/:id (GET) - business should get their own voucher', () => {
    return request(app.getHttpServer())
      .get(`/vouchers/${voucherId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.id).toEqual(voucherId);
      });
  });

  it('/vouchers/:id (PATCH) - business should update their own voucher', () => {
    return request(app.getHttpServer())
      .patch(`/vouchers/${voucherId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({ title: 'Updated Title' })
      .expect(200)
      .then((res) => {
        expect(res.body.title).toEqual('Updated Title');
      });
  });

  it('/vouchers/:id (DELETE) - business should delete their own voucher', () => {
    return request(app.getHttpServer())
      .delete(`/vouchers/${voucherId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(200);
  });
});
