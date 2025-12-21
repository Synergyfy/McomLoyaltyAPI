import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRewardEntities1764658150119 implements MigrationInterface {
  name = "UpdateRewardEntities1764658150119";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reward" RENAME COLUMN "points_required" TO "max_points"`,
    );
    await queryRunner.query(
      `CREATE TABLE "system_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" character varying NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key"), CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "extraPoints" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_history_purchasetype_enum" AS ENUM('membership', 'extra_points')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" ADD "purchaseType" "public"."payment_history_purchasetype_enum" NOT NULL DEFAULT 'membership'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" ADD "pointsPurchased" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "value" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum" RENAME TO "point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum" AS ENUM('EARN', 'REDEEM', 'MATCHING', 'PURCHASED_EXTRA')`,
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
      `CREATE TYPE "public"."point_histories_type_enum_old" AS ENUM('EARN', 'REDEEM', 'MATCHING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum_old" USING "type"::"text"::"public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."point_histories_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum_old" RENAME TO "point_histories_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "value" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP COLUMN "pointsPurchased"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP COLUMN "purchaseType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_history_purchasetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "extraPoints"`,
    );
    await queryRunner.query(`DROP TABLE "system_settings"`);
    await queryRunner.query(
      `ALTER TABLE "reward" RENAME COLUMN "max_points" TO "points_required"`,
    );
  }
}
