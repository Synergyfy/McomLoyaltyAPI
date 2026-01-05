import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingRewardFields1767389471187 implements MigrationInterface {
  name = "AddMissingRewardFields1767389471187";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reward_reward_source_enum" AS ENUM('mcom vault', 'partner', 'business')`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "reward_source" "public"."reward_reward_source_enum" NOT NULL DEFAULT 'mcom vault'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_codes" ADD "redemption_method" character varying DEFAULT 'auto'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_codes" DROP COLUMN "redemption_method"`,
    );
    await queryRunner.query(`ALTER TABLE "reward" DROP COLUMN "reward_source"`);
    await queryRunner.query(`DROP TYPE "public"."reward_reward_source_enum"`);
  }
}
