import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { Role } from "../src/common/role.enum";
import { Admin } from "../src/resources/admin/entities/admin.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HashService } from "../src/common/hash/hash.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let adminRepository: Repository<Admin>;
  let hashService: HashService;
  let admin: Admin;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    adminRepository = moduleFixture.get<Repository<Admin>>(
      getRepositoryToken(Admin),
    );
    hashService = moduleFixture.get<HashService>(HashService);
    await app.init();

    const hashedPassword = await hashService.hashPassword("password");
    admin = adminRepository.create({
      name: "Test Admin",
      email: "test@example.com",
      password: hashedPassword,
      role: Role.Admin,
    });
    await adminRepository.save(admin);
  });

  afterAll(async () => {
    await adminRepository.delete(admin.id);
    await app.close();
  });

  it("/auth/login (POST)", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password" })
      .expect(201);

    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("refresh_token");
    refreshToken = res.body.refresh_token;
  });

  it("/auth/refresh-token (POST)", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/refresh-token")
      .send({ refreshToken })
      .expect(201);

    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("refresh_token");
  });

  it("/auth/refresh-token (POST) with invalid token", async () => {
    await request(app.getHttpServer())
      .post("/auth/refresh-token")
      .send({ refreshToken: "invalidtoken" })
      .expect(401);
  });
});
