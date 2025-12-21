import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStampRequirementsToRewards1766221553572
  implements MigrationInterface
{
  name = "AddStampRequirementsToRewards1766221553572";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."business_stamp_packages_status_enum" AS ENUM('ACTIVE', 'DEPLETED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_stamp_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "initial_stamps" integer NOT NULL, "remaining_stamps" integer NOT NULL, "transaction_id" character varying, "status" "public"."business_stamp_packages_status_enum" NOT NULL DEFAULT 'ACTIVE', "business_id" uuid, "package_id" uuid, CONSTRAINT "PK_c1ff9f3cd436ace7f4516b3eba4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stamp_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "stamps" integer NOT NULL, "price" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_8efeb266fe23d57ff5f7c8f7806" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stamp_package_tiers" ("stamp_package_id" uuid NOT NULL, "tier_id" uuid NOT NULL, CONSTRAINT "PK_92b4c036bfc91cec7a15a0aa6c5" PRIMARY KEY ("stamp_package_id", "tier_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9505b6c62f73c528a56edafac8" ON "stamp_package_tiers" ("stamp_package_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1675d5f8dc024a7f50b7a30c9c" ON "stamp_package_tiers" ("tier_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "max_stamp_required" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "stamp_required" integer`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_reward_mode_enum" AS ENUM('points', 'stamps', 'both')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "reward_mode" "public"."business_campaigns_reward_mode_enum" NOT NULL DEFAULT 'points'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "business_stamp_reward_id" uuid`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_reward_mode_enum" AS ENUM('points', 'stamps', 'both')`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "reward_mode" "public"."campaigns_reward_mode_enum" NOT NULL DEFAULT 'points'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_codes" ADD "stamps" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ALTER COLUMN "max_points" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "point_required" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."stamp_reward_templates_trigger_method_enum" RENAME TO "stamp_reward_templates_trigger_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_reward_templates_trigger_method_enum" AS ENUM('QR_SCAN', 'PURCHASE', 'CHECK_IN', 'MANUAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_reward_templates" ALTER COLUMN "trigger_method" TYPE "public"."stamp_reward_templates_trigger_method_enum" USING "trigger_method"::"text"::"public"."stamp_reward_templates_trigger_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."stamp_reward_templates_trigger_method_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."stamp_events_trigger_method_enum" RENAME TO "stamp_events_trigger_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_events_trigger_method_enum" AS ENUM('QR_SCAN', 'PURCHASE', 'CHECK_IN', 'MANUAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_events" ALTER COLUMN "trigger_method" TYPE "public"."stamp_events_trigger_method_enum" USING "trigger_method"::"text"::"public"."stamp_events_trigger_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."stamp_events_trigger_method_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_codes_type_enum" RENAME TO "transaction_codes_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_codes_type_enum" AS ENUM('EARN', 'REDEEM', 'STAMP_EARN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_codes" ALTER COLUMN "type" TYPE "public"."transaction_codes_type_enum" USING "type"::"text"::"public"."transaction_codes_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transaction_codes_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('POINT_AWARDED', 'REWARD_REDEEMED', 'ALLOWANCE_WARNING', 'CAMPAIGN_JOINED', 'STAMP_AWARDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD CONSTRAINT "FK_c799f1f2b4aa21f795b5dffc4a2" FOREIGN KEY ("business_stamp_reward_id") REFERENCES "business_stamp_rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_packages" ADD CONSTRAINT "FK_265a1b997de1e17683a5bab527f" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_packages" ADD CONSTRAINT "FK_ab7ed5fbd30f122d4e725e4eb61" FOREIGN KEY ("package_id") REFERENCES "stamp_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_package_tiers" ADD CONSTRAINT "FK_9505b6c62f73c528a56edafac80" FOREIGN KEY ("stamp_package_id") REFERENCES "stamp_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_package_tiers" ADD CONSTRAINT "FK_1675d5f8dc024a7f50b7a30c9ce" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stamp_package_tiers" DROP CONSTRAINT "FK_1675d5f8dc024a7f50b7a30c9ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_package_tiers" DROP CONSTRAINT "FK_9505b6c62f73c528a56edafac80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_packages" DROP CONSTRAINT "FK_ab7ed5fbd30f122d4e725e4eb61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_packages" DROP CONSTRAINT "FK_265a1b997de1e17683a5bab527f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP CONSTRAINT "FK_c799f1f2b4aa21f795b5dffc4a2"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('POINT_AWARDED', 'REWARD_REDEEMED', 'ALLOWANCE_WARNING', 'CAMPAIGN_JOINED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_codes_type_enum_old" AS ENUM('EARN', 'REDEEM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_codes" ALTER COLUMN "type" TYPE "public"."transaction_codes_type_enum_old" USING "type"::"text"::"public"."transaction_codes_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."transaction_codes_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_codes_type_enum_old" RENAME TO "transaction_codes_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_events_trigger_method_enum_old" AS ENUM('QR_SCAN', 'PURCHASE', 'CHECK_IN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_events" ALTER COLUMN "trigger_method" TYPE "public"."stamp_events_trigger_method_enum_old" USING "trigger_method"::"text"::"public"."stamp_events_trigger_method_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."stamp_events_trigger_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."stamp_events_trigger_method_enum_old" RENAME TO "stamp_events_trigger_method_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_reward_templates_trigger_method_enum_old" AS ENUM('QR_SCAN', 'PURCHASE', 'CHECK_IN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_reward_templates" ALTER COLUMN "trigger_method" TYPE "public"."stamp_reward_templates_trigger_method_enum_old" USING "trigger_method"::"text"::"public"."stamp_reward_templates_trigger_method_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."stamp_reward_templates_trigger_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."stamp_reward_templates_trigger_method_enum_old" RENAME TO "stamp_reward_templates_trigger_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "point_required" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ALTER COLUMN "max_points" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_codes" DROP COLUMN "stamps"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "reward_mode"`,
    );
    await queryRunner.query(`DROP TYPE "public"."campaigns_reward_mode_enum"`);
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "business_stamp_reward_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "reward_mode"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_campaigns_reward_mode_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "stamp_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "max_stamp_required"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1675d5f8dc024a7f50b7a30c9c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9505b6c62f73c528a56edafac8"`,
    );
    await queryRunner.query(`DROP TABLE "stamp_package_tiers"`);
    await queryRunner.query(`DROP TABLE "stamp_packages"`);
    await queryRunner.query(`DROP TABLE "business_stamp_packages"`);
    await queryRunner.query(
      `DROP TYPE "public"."business_stamp_packages_status_enum"`,
    );
  }
}
