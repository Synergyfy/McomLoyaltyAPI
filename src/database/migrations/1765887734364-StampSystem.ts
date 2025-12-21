import { MigrationInterface, QueryRunner } from "typeorm";

export class StampSystem1765887734364 implements MigrationInterface {
  name = "StampSystem1765887734364";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_reward_templates_reward_benefit_enum" AS ENUM('FREE_ITEM', 'DISCOUNT', 'FREE_SERVICE', 'BONUS_POINTS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_reward_templates_trigger_method_enum" AS ENUM('QR_SCAN', 'PURCHASE', 'CHECK_IN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stamp_reward_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "description" character varying NOT NULL, "required_stamps" integer NOT NULL, "reward_benefit" "public"."stamp_reward_templates_reward_benefit_enum" NOT NULL, "reward_benefit_value" character varying, "trigger_method" "public"."stamp_reward_templates_trigger_method_enum" NOT NULL, "stamp_validity_days" integer, "reward_claim_deadline_days" integer, "is_hybrid" boolean NOT NULL DEFAULT false, "hybrid_points_per_stamp" integer NOT NULL DEFAULT '0', "hybrid_completion_bonus_points" integer NOT NULL DEFAULT '0', "is_published" boolean NOT NULL DEFAULT false, "default_image" character varying, CONSTRAINT "PK_40a72e39784e7dad9d8adb012d7" PRIMARY KEY ("id")); COMMENT ON COLUMN "stamp_reward_templates"."stamp_validity_days" IS 'Days valid after start'; COMMENT ON COLUMN "stamp_reward_templates"."reward_claim_deadline_days" IS 'Days to redeem after completion'`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_stamp_rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "custom_image" character varying, "operating_hours" character varying, "is_active" boolean NOT NULL DEFAULT true, "total_enrolled" integer NOT NULL DEFAULT '0', "total_completions" integer NOT NULL DEFAULT '0', "total_redemptions" integer NOT NULL DEFAULT '0', "templateId" uuid, "businessId" uuid, CONSTRAINT "PK_c24a461b4451556c0abf040b5b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_cards_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED', 'REDEEMED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stamp_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "current_stamps" integer NOT NULL DEFAULT '0', "status" "public"."stamp_cards_status_enum" NOT NULL DEFAULT 'IN_PROGRESS', "completed_at" TIMESTAMP, "redeemed_at" TIMESTAMP, "businessStampRewardId" uuid, "participantId" uuid, CONSTRAINT "PK_a3224c1e375fdbcf825500f4fc0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stamp_events_trigger_method_enum" AS ENUM('QR_SCAN', 'PURCHASE', 'CHECK_IN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stamp_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "trigger_method" "public"."stamp_events_trigger_method_enum" NOT NULL, "points_added" integer NOT NULL DEFAULT '0', "metadata" character varying, "stampCardId" uuid, CONSTRAINT "PK_c9b0b995c8006f85450747dd465" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_rewards" ADD CONSTRAINT "FK_b4970f7dddcfa457878a8026d9a" FOREIGN KEY ("templateId") REFERENCES "stamp_reward_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_rewards" ADD CONSTRAINT "FK_276a5e06f3a424c1317c6c35753" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_cards" ADD CONSTRAINT "FK_c6ea5ebe7f005ffefa61944367a" FOREIGN KEY ("businessStampRewardId") REFERENCES "business_stamp_rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_cards" ADD CONSTRAINT "FK_8a3e39b98940d450f8f4ccec285" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_events" ADD CONSTRAINT "FK_f0673ec40de7a759360ec1039a1" FOREIGN KEY ("stampCardId") REFERENCES "stamp_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stamp_events" DROP CONSTRAINT "FK_f0673ec40de7a759360ec1039a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_cards" DROP CONSTRAINT "FK_8a3e39b98940d450f8f4ccec285"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stamp_cards" DROP CONSTRAINT "FK_c6ea5ebe7f005ffefa61944367a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_rewards" DROP CONSTRAINT "FK_276a5e06f3a424c1317c6c35753"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_stamp_rewards" DROP CONSTRAINT "FK_b4970f7dddcfa457878a8026d9a"`,
    );
    await queryRunner.query(`DROP TABLE "stamp_events"`);
    await queryRunner.query(
      `DROP TYPE "public"."stamp_events_trigger_method_enum"`,
    );
    await queryRunner.query(`DROP TABLE "stamp_cards"`);
    await queryRunner.query(`DROP TYPE "public"."stamp_cards_status_enum"`);
    await queryRunner.query(`DROP TABLE "business_stamp_rewards"`);
    await queryRunner.query(`DROP TABLE "stamp_reward_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."stamp_reward_templates_trigger_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."stamp_reward_templates_reward_benefit_enum"`,
    );
  }
}
