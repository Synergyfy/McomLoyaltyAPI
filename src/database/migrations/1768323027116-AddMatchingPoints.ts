import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMatchingPoints1768323027116 implements MigrationInterface {
  name = "AddMatchingPoints1768323027116";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "is_matching_points_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "matching_points_required" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "is_matching_points_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "matching_points_required" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD "matching_points" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum" RENAME TO "point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum" AS ENUM('EARN', 'REDEEM', 'MATCHING', 'MATCHING_REDEEM', 'PURCHASED_EXTRA', 'STAMP_EARN', 'STAMP_REDEEM', 'BUSINESS_STAMP_SPENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum" USING "type"::"text"::"public"."point_histories_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."point_histories_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum_old" AS ENUM('EARN', 'REDEEM', 'MATCHING', 'PURCHASED_EXTRA', 'STAMP_EARN', 'STAMP_REDEEM', 'BUSINESS_STAMP_SPENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum_old" USING "type"::"text"::"public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."point_histories_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum_old" RENAME TO "point_histories_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP COLUMN "matching_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "matching_points_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "is_matching_points_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "matching_points_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "is_matching_points_enabled"`,
    );
  }
}
