import { DataSource } from "typeorm";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

export async function clearDatabase(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(
      `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
    );
  }
}

export async function getBusiness(app: INestApplication, jwtToken: string) {
  const response = await request(app.getHttpServer())
    .post("/listings")
    .set("Authorization", `Bearer ${jwtToken}`)
    .send({
      listingType: ["PRODUCT_LISTING"],
      businessName: "Test Business",
      shortDescription: "Test short description",
      businessPhone: "+447911123456",
    })
    .expect(201);
  return response.body;
}

export async function createProduct(
  app: INestApplication,
  jwtToken: string,
  businessId: string,
) {
  const response = await request(app.getHttpServer())
    .post("/products")
    .set("Authorization", `Bearer ${jwtToken}`)
    .send({
      businessId,
      title: "Test Product",
      productType: "physical",
      price: 10,
      description: "Test product description",
      sku: `test-sku-${Date.now()}`,
      category: "test",
    })
    .expect(201);
  return response.body;
}
