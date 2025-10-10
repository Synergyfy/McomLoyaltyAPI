import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDatabase, getBusiness, createProduct } from './test-utils';
import { UsersService } from '../src/resources/users/users.service';
import { CreateUserDto } from '../src/resources/users/dto/create-user.dto';
import { UserRole } from '../src/common/role.enum';
import { CreatePromotionDto } from 'src/resources/promotion/dto/create-promotion.dto';
import {
  PromotionScope,
  PromotionType,
} from 'src/resources/promotion/promotion.enum';

describe('PromotionController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let business: any;
  let product: any;
  let promotion: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await clearDatabase(app);

    const usersService = app.get(UsersService);
    const email = `test-${Date.now()}@test.com`;
    const password = 'password123';
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email,
      password,
      confirm_password: password,
      phoneNumber: '1234567890',
      role: UserRole.OWNER,
    };
    await usersService.create(createUserDto);

    const response = await request(app.getHttpServer())
      .post('/auth')
      .send({ email, password })
      .expect(201);

    jwtToken = response.body.auth.accessToken;

    business = await getBusiness(app, jwtToken);
    product = await createProduct(app, jwtToken, business.id);

    const createPromotionDto: CreatePromotionDto = {
      name: 'Test Promotion',
      promotionType: PromotionType.MULTIPLIER,
      promotionScope: PromotionScope.SPECIFIC_LISTINGS,
      businessIds: [business.id],
      includedProductIds: [product.id],
      excludedProductIds: [],
      multiplier: 2,
      minimumSpend: 10,
      description: 'test',
      termsAndConditions: 'test',
      isActive: true,
      beginDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      bonusPoints: 0,
      limitPerCustomer: 0,
    };

    const promotionResponse = await request(app.getHttpServer())
      .post('/promotions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createPromotionDto)
      .expect(201);

    promotion = promotionResponse.body;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/promotions (GET)', () => {
    return request(app.getHttpServer())
      .get('/promotions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(promotion.id);
      });
  });

  it('/promotions/check (GET)', () => {
    return request(app.getHttpServer())
      .get(
        `/promotions/check?businessId=${business.id}&productId=${product.id}`,
      )
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(promotion.id);
      });
  });

  it('/promotions/check (GET) with ALL_LISTINGS scope', async () => {
    const createPromotionDto: CreatePromotionDto = {
      name: 'All Listings Promotion',
      promotionType: PromotionType.MULTIPLIER,
      promotionScope: PromotionScope.ALL_LISTINGS,
      multiplier: 3,
      minimumSpend: 20,
      description: 'test all listings',
      termsAndConditions: 'test all listings',
      isActive: true,
      beginDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      bonusPoints: 0,
      limitPerCustomer: 0,
      businessIds: [],
      includedProductIds: [],
      excludedProductIds: [],
    };

    await request(app.getHttpServer())
      .post('/promotions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createPromotionDto)
      .expect(201);

    return request(app.getHttpServer())
      .get(`/promotions/check?businessId=${business.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(2);
      });
  });
});
