import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBusinessRewardSchema1764055038881
  implements MigrationInterface
{
  name = "UpdateBusinessRewardSchema1764055038881";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "title" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "reward_type" character varying NOT NULL DEFAULT 'PHYSICAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "badge_level" character varying NOT NULL DEFAULT 'BRONZE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "reward_source" character varying NOT NULL DEFAULT 'SYSTEM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "audience" character varying NOT NULL DEFAULT 'ALL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "expiry_datetime" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "status" character varying NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "value" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "description" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "image" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "disabled" boolean NOT NULL DEFAULT false`,
    );

    // Make reward_id nullable
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "reward_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "reward_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "disabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "image"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "expiry_datetime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "audience"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "reward_source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "badge_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "reward_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "title"`,
    );
  }
}
