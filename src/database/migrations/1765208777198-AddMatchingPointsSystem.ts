import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMatchingPointsSystem1765208777198
  implements MigrationInterface
{
  name = "AddMatchingPointsSystem1765208777198";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" RENAME COLUMN "matchingPointBalance" TO "matching_points"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_config_activity_type_enum" AS ENUM('CAMPAIGN_CREATION', 'REFERRAL', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "matching_point_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "activity_type" "public"."matching_point_config_activity_type_enum" NOT NULL, "points" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_09f41fca470928f514be154358c" UNIQUE ("activity_type"), CONSTRAINT "PK_1f9e4f3d9a1f223fac7bda84c67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP COLUMN "activityType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_history_activitytype_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_history_activity_type_enum" AS ENUM('CAMPAIGN_CREATION', 'REFERRAL', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD "activity_type" "public"."matching_point_history_activity_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "matching_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "matching_points" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP CONSTRAINT "FK_c0b86b300fd834cfa908baad165"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP COLUMN "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD "points" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ALTER COLUMN "businessId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD CONSTRAINT "FK_c0b86b300fd834cfa908baad165" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP CONSTRAINT "FK_c0b86b300fd834cfa908baad165"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ALTER COLUMN "businessId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP COLUMN "points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD "points" numeric NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD CONSTRAINT "FK_c0b86b300fd834cfa908baad165" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "matching_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "matching_points" numeric NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP COLUMN "activity_type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_history_activity_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_history_activitytype_enum" AS ENUM('CAMPAIGN_CREATION', 'REFER_BUSINESS', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD "activityType" "public"."matching_point_history_activitytype_enum" NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "matching_point_config"`);
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_config_activity_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" RENAME COLUMN "matching_points" TO "matchingPointBalance"`,
    );
  }
}
