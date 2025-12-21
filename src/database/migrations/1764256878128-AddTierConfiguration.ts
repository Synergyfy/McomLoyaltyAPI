import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTierConfiguration1764256878128 implements MigrationInterface {
  name = "AddTierConfiguration1764256878128";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tier" ADD "configuration" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "configuration"`);
  }
}
