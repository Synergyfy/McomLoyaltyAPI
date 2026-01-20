import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncTiers1768744585845 implements MigrationInterface {
  name = "SyncTiers1768744585845";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tier" RENAME COLUMN "quaterly_price" TO "quarterly_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier_history" RENAME COLUMN "quaterly_price" TO "quarterly_price"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tier_history" RENAME COLUMN "quarterly_price" TO "quaterly_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier" RENAME COLUMN "quarterly_price" TO "quaterly_price"`,
    );
  }
}
