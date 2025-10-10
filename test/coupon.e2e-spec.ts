import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDatabase } from './test-utils';
import { CreateCouponDto } from '../src/resources/coupon/dto/create-coupon.dto';
import { DiscountType } from '../src/resources/coupon/coupon.enum';
import { UsersService } from '../src/resources/users/users.service';
import { CreateUserDto } from '../src/resources/users/dto/create-user.dto';
import { UserRole } from '../src/common/role.enum';

describe('CouponController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a coupon with a timestamp expiryDate', async () => {
    const createCouponDto: CreateCouponDto = {
      couponCode: 'TESTCODE',
      discountType: DiscountType.PERCENTAGE,
      couponAmount: 10,
      expiryDate: new Date(), // Use a timestamp
      businessIds: [],
      allowedEmails: '',
      couponDescription: '',
      individualUseOnly: false,
      maxSpend: null,
      minSpend: null,
      usageLimitPerCoupon: null,
      usageLimitPerUser: null,
    };

    const response = await request(app.getHttpServer())
      .post('/coupons')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createCouponDto)
      .expect(201);

    expect(response.body).toHaveProperty('couponCode', 'TESTCODE');
  });
});
