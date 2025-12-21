import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRewardSource1765794145401 implements MigrationInterface {
  name = "RemoveRewardSource1765794145401";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reward" DROP COLUMN "reward_source"`);
    await queryRunner.query(`DROP TYPE "public"."reward_reward_source_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reward_reward_source_enum" AS ENUM('mcom vault', 'partner', 'business')`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "reward_source" "public"."reward_reward_source_enum" NOT NULL`,
    );
  }
}
