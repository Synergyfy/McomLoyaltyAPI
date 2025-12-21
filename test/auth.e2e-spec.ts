import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Admin } from "../src/resources/admin/entities/admin.entity";
import { DataSource, Repository } from "typeorm";
import { IsPasswordMatchingConstraint } from "../src/common/decorators/validation/is-password-matching.decorator";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let adminRepository: Repository<Admin>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [IsPasswordMatchingConstraint],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);
    adminRepository = moduleFixture.get<Repository<Admin>>(
      getRepositoryToken(Admin),
    );
    await app.init();
  });

  afterEach(async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        'TRUNCATE TABLE "admins" RESTART IDENTITY CASCADE',
      );
    } finally {
      await queryRunner.release();
    }
    await app.close();
  });

  it("/admin/signup (POST) - success", async () => {
    return request(app.getHttpServer())
      .post("/admin/signup")
      .send({
        name: "Test Admin",
        email: "admin@example.com",
        password: "adminPassword123",
        confirmPassword: "adminPassword123",
      })
      .expect(201);
  });

  it("/auth/login (POST) - success", async () => {
    await request(app.getHttpServer()).post("/admin/signup").send({
      name: "Test Admin",
      email: "admin@example.com",
      password: "adminPassword123",
      confirmPassword: "adminPassword123",
    });

    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "adminPassword123" })
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty("user");
        expect(res.body.user).toHaveProperty("name", "Test Admin");
        expect(res.body.user).toHaveProperty("role", "Admin");
        expect(res.body).toHaveProperty("access_token");
        expect(res.body).toHaveProperty("refresh_token");
      });
  });

  it("/admin/signup (POST) - missing confirmPassword", async () => {
    return request(app.getHttpServer())
      .post("/admin/signup")
      .send({
        name: "Test Admin",
        email: "admin@example.com",
        password: "adminPassword123",
      })
      .expect(400);
  });

  it("/admin/signup (POST) - password mismatch", async () => {
    return request(app.getHttpServer())
      .post("/admin/signup")
      .send({
        name: "Test Admin",
        email: "admin@example.com",
        password: "adminPassword123",
        confirmPassword: "wrongPassword",
      })
      .expect(400)
      .then((res) => {
        expect(res.body.message[0]).toContain("Passwords do not match");
      });
  });

  it("/admin/signup (POST) - duplicate email", async () => {
    await request(app.getHttpServer()).post("/admin/signup").send({
      name: "Test Admin",
      email: "admin@example.com",
      password: "adminPassword123",
      confirmPassword: "adminPassword123",
    });

    return request(app.getHttpServer())
      .post("/admin/signup")
      .send({
        name: "Another Admin",
        email: "admin@example.com",
        password: "adminPassword123",
        confirmPassword: "adminPassword123",
      })
      .expect(409)
      .then((res) => {
        expect(res.body.message).toContain("Email already exists");
      });
  });

  it("/auth/login (POST) - invalid credentials", async () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "wrongPassword" })
      .expect(401)
      .then((res) => {
        expect(res.body.message).toContain("Invalid login credentials");
      });
  });
});
