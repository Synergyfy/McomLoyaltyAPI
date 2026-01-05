import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRewardPointsAndStampsFields1767009097057
  implements MigrationInterface
{
  name = "AddRewardPointsAndStampsFields1767009097057";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "is_points_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "is_stamps_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "stamp_emoji" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "is_points_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "is_stamps_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "stamp_emoji" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "stamp_emoji"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "is_stamps_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "is_points_enabled"`,
    );
    await queryRunner.query(`ALTER TABLE "reward" DROP COLUMN "stamp_emoji"`);
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "is_stamps_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "is_points_enabled"`,
    );
  }
}
