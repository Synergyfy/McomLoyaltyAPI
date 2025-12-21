import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTierEntity1765809575727 implements MigrationInterface {
  name = "UpdateTierEntity1765809575727";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tier_type_enum" AS ENUM('standard', 'seasonal')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier" ADD "type" "public"."tier_type_enum" NOT NULL DEFAULT 'standard'`,
    );
    await queryRunner.query(`ALTER TABLE "tier" ADD "start_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tier" ADD "end_date" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "tier" ADD "color_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tier" ADD "fixed_price" numeric(10,2) DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "fixed_price"`);
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "color_code"`);
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "end_date"`);
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "start_date"`);
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."tier_type_enum"`);
  }
}
