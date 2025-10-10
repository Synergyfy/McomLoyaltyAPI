import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/resources/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('Email (e2e)', () => {
  let app: INestApplication;
  let mailerService: MailerService;
  let userRepository: Repository<User>;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mailerService = moduleFixture.get<MailerService>(MailerService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send a welcome email to a new user', async () => {
    const createUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
      phoneNumber: '1234567890',
    };

    // Mock the user creation
    const user = new User();
    user.id = '1';
    user.name = createUserDto.name;
    user.email = createUserDto.email;

    jest.spyOn(userRepository, 'create').mockReturnValue(user);
    jest.spyOn(userRepository, 'save').mockResolvedValue(user);

    await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);

    expect(mockMailerService.sendMail).toHaveBeenCalledWith({
      to: createUserDto.email,
      subject: 'Welcome to McomMall!',
      template: './welcome',
      context: {
        name: createUserDto.name,
      },
    });
  });
});
