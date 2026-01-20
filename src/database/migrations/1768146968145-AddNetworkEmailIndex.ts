import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNetworkEmailIndex1768146968145 implements MigrationInterface {
  name = "AddNetworkEmailIndex1768146968145";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_0b09997abfa4bdbe88cac77f97" ON "networks" ("email") WHERE "email" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b09997abfa4bdbe88cac77f97"`,
    );
  }
}
