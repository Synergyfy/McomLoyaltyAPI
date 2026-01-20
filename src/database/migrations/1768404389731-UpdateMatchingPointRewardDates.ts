import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMatchingPointRewardDates1768404389731
  implements MigrationInterface
{
  name = "UpdateMatchingPointRewardDates1768404389731";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP CONSTRAINT "FK_1e21e76809f1e6adef91882fc63"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_reward_target_audience_enum" AS ENUM('BUSINESS_ONLY', 'PARTICIPANT_ONLY', 'BOTH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "matching_point_reward" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "short_description" character varying NOT NULL, "long_description" text NOT NULL, "main_image" character varying NOT NULL, "gallery_images" text, "required_points" integer NOT NULL, "target_audience" "public"."matching_point_reward_target_audience_enum" NOT NULL, "quantity" integer NOT NULL, "is_suspended" boolean NOT NULL DEFAULT false, "start_datetime" TIMESTAMP, "end_datetime" TIMESTAMP, "creatorBusinessId" uuid, "creatorAdminId" uuid, CONSTRAINT "PK_f2f98be60f25ba5e3a211e3a497" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2c361c054ee87db24a4923ce8" ON "matching_point_reward" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_968364b7dafbbc37ab485560c9" ON "matching_point_reward" ("required_points") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33016234519d1fa303a6211766" ON "matching_point_reward" ("target_audience") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06b21f983fd3c75f74a5715924" ON "matching_point_reward" ("is_suspended") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f6ed80e92564e2e3d2352552b" ON "matching_point_reward" ("start_datetime") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ff7b43f5ef8691a8670dcf0dd" ON "matching_point_reward" ("end_datetime") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_redemption_redeemer_type_enum" AS ENUM('BUSINESS', 'PARTICIPANT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "matching_point_redemption" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "points_spent" integer NOT NULL, "redeemer_type" "public"."matching_point_redemption_redeemer_type_enum" NOT NULL, "rewardId" uuid, "businessId" uuid, "participantId" uuid, CONSTRAINT "PK_3132495d7f214657a056f0d21e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "is_matching_points_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" DROP COLUMN "matching_points_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "is_matching_points_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "matching_points_required"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "reward_type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_campaigns_reward_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "matching_points_threshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "total_matching_points_earned"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "matching_points_disabled_by_admin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "matching_points_ratio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP COLUMN "beneficiary_business_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP COLUMN "matching_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "reward_type"`,
    );
    await queryRunner.query(`DROP TYPE "public"."campaigns_reward_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "matching_points_threshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "total_matching_points_earned"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "matching_points_disabled_by_admin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD "participantId" uuid`,
    );

    // Clean up existing 'matching_point' values before altering enums
    await queryRunner.query(
      `UPDATE "business_campaigns" SET "campaign_type" = 'qr_code' WHERE "campaign_type"::text = 'matching_point'`,
    );
    await queryRunner.query(
      `UPDATE "campaigns" SET "campaign_type" = 'qr_code' WHERE "campaign_type"::text = 'matching_point'`,
    );

    // Clean up existing 'MATCHING' point history types
    await queryRunner.query(
      `UPDATE "point_histories" SET "type" = 'EARN' WHERE "type"::text = 'MATCHING'`,
    );
    await queryRunner.query(
      `UPDATE "point_histories" SET "type" = 'REDEEM' WHERE "type"::text = 'MATCHING_REDEEM'`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."business_campaigns_campaign_type_enum" RENAME TO "business_campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_campaign_type_enum" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "campaign_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "campaign_type" TYPE "public"."business_campaigns_campaign_type_enum" USING "campaign_type"::"text"::"public"."business_campaigns_campaign_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "campaign_type" SET DEFAULT 'qr_code'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum" RENAME TO "point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum" AS ENUM('EARN', 'REDEEM', 'PURCHASED_EXTRA', 'STAMP_EARN', 'STAMP_REDEEM', 'BUSINESS_STAMP_SPENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum" USING "type"::"text"::"public"."point_histories_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."campaigns_campaign_type_enum" RENAME TO "campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_campaign_type_enum" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion')`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "campaign_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "campaign_type" TYPE "public"."campaigns_campaign_type_enum" USING "campaign_type"::"text"::"public"."campaigns_campaign_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "campaign_type" SET DEFAULT 'qr_code'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."matching_point_config_activity_type_enum" RENAME TO "matching_point_config_activity_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_config_activity_type_enum" AS ENUM('CAMPAIGN_CREATION', 'REFERRAL', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT', 'REWARD_REDEMPTION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_config" ALTER COLUMN "activity_type" TYPE "public"."matching_point_config_activity_type_enum" USING "activity_type"::"text"::"public"."matching_point_config_activity_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_config_activity_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_607294233404aee15015863108"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."matching_point_history_activity_type_enum" RENAME TO "matching_point_history_activity_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_history_activity_type_enum" AS ENUM('CAMPAIGN_CREATION', 'REFERRAL', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT', 'REWARD_REDEMPTION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ALTER COLUMN "activity_type" TYPE "public"."matching_point_history_activity_type_enum" USING "activity_type"::"text"::"public"."matching_point_history_activity_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_history_activity_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac498edd56d33d7b80f5d536f2" ON "matching_point_history" ("participantId", "activity_type", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_607294233404aee15015863108" ON "matching_point_history" ("businessId", "activity_type", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_52516b3326aaaf8996302191c4" ON "matching_point_history" ("participantId", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_reward" ADD CONSTRAINT "FK_26a90b0d72b7568cb5c49690400" FOREIGN KEY ("creatorBusinessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_reward" ADD CONSTRAINT "FK_726d1219fba30e32e75cc363178" FOREIGN KEY ("creatorAdminId") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_redemption" ADD CONSTRAINT "FK_a6b16b331b5b23c48b9692a5cef" FOREIGN KEY ("rewardId") REFERENCES "matching_point_reward"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_redemption" ADD CONSTRAINT "FK_25570670a410e5a83bf398282c3" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_redemption" ADD CONSTRAINT "FK_ec23051616da5927923f119464a" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD CONSTRAINT "FK_16896483b964497c3eedb426ae7" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP CONSTRAINT "FK_16896483b964497c3eedb426ae7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_redemption" DROP CONSTRAINT "FK_ec23051616da5927923f119464a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_redemption" DROP CONSTRAINT "FK_25570670a410e5a83bf398282c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_redemption" DROP CONSTRAINT "FK_a6b16b331b5b23c48b9692a5cef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_reward" DROP CONSTRAINT "FK_726d1219fba30e32e75cc363178"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_reward" DROP CONSTRAINT "FK_26a90b0d72b7568cb5c49690400"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_52516b3326aaaf8996302191c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_607294233404aee15015863108"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac498edd56d33d7b80f5d536f2"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_history_activity_type_enum_old" AS ENUM('CAMPAIGN_CREATION', 'REFERRAL', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ALTER COLUMN "activity_type" TYPE "public"."matching_point_history_activity_type_enum_old" USING "activity_type"::"text"::"public"."matching_point_history_activity_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_history_activity_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."matching_point_history_activity_type_enum_old" RENAME TO "matching_point_history_activity_type_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_607294233404aee15015863108" ON "matching_point_history" ("activity_type", "businessId", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matching_point_config_activity_type_enum_old" AS ENUM('CAMPAIGN_CREATION', 'REFERRAL', 'MEMBERSHIP_PAYMENT', 'MANUAL_ADJUSTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_config" ALTER COLUMN "activity_type" TYPE "public"."matching_point_config_activity_type_enum_old" USING "activity_type"::"text"::"public"."matching_point_config_activity_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_config_activity_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."matching_point_config_activity_type_enum_old" RENAME TO "matching_point_config_activity_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_campaign_type_enum_old" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion', 'matching_point')`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "campaign_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "campaign_type" TYPE "public"."campaigns_campaign_type_enum_old" USING "campaign_type"::"text"::"public"."campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "campaign_type" SET DEFAULT 'qr_code'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."campaigns_campaign_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."campaigns_campaign_type_enum_old" RENAME TO "campaigns_campaign_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum_old" AS ENUM('EARN', 'REDEEM', 'MATCHING', 'MATCHING_REDEEM', 'PURCHASED_EXTRA', 'STAMP_EARN', 'STAMP_REDEEM', 'BUSINESS_STAMP_SPENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum_old" USING "type"::"text"::"public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."point_histories_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum_old" RENAME TO "point_histories_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_campaign_type_enum_old" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion', 'matching_point')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "campaign_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "campaign_type" TYPE "public"."business_campaigns_campaign_type_enum_old" USING "campaign_type"::"text"::"public"."business_campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "campaign_type" SET DEFAULT 'qr_code'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_campaigns_campaign_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."business_campaigns_campaign_type_enum_old" RENAME TO "business_campaigns_campaign_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP COLUMN "participantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "matching_points_disabled_by_admin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "total_matching_points_earned" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "matching_points_threshold" integer`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_reward_type_enum" AS ENUM('regular', 'matching', 'both')`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "reward_type" "public"."campaigns_reward_type_enum" NOT NULL DEFAULT 'regular'`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD "matching_points" integer DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD "beneficiary_business_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "matching_points_ratio" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "matching_points_disabled_by_admin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "total_matching_points_earned" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "matching_points_threshold" integer`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_reward_type_enum" AS ENUM('regular', 'matching', 'both')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "reward_type" "public"."business_campaigns_reward_type_enum" NOT NULL DEFAULT 'regular'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "matching_points_required" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "is_matching_points_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "matching_points_required" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ADD "is_matching_points_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`DROP TABLE "matching_point_redemption"`);
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_redemption_redeemer_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7ff7b43f5ef8691a8670dcf0dd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f6ed80e92564e2e3d2352552b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06b21f983fd3c75f74a5715924"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_33016234519d1fa303a6211766"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_968364b7dafbbc37ab485560c9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2c361c054ee87db24a4923ce8"`,
    );
    await queryRunner.query(`DROP TABLE "matching_point_reward"`);
    await queryRunner.query(
      `DROP TYPE "public"."matching_point_reward_target_audience_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD CONSTRAINT "FK_1e21e76809f1e6adef91882fc63" FOREIGN KEY ("beneficiary_business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
