import { MigrationInterface, QueryRunner } from "typeorm";

export class StampRefactor1767652397130 implements MigrationInterface {
  name = "StampRefactor1767652397130";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" DROP CONSTRAINT "FK_8a615ddc1d1994d3da708a0ea9f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP CONSTRAINT "FK_c799f1f2b4aa21f795b5dffc4a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73556eda143a5e520fa22a5b92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" RENAME COLUMN "businessCampaignId" TO "business_campaign_id"`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_campaign_rewards" ("business_campaign_id" uuid NOT NULL, "business_reward_id" uuid NOT NULL, CONSTRAINT "PK_b457d0cfb9606a1c4ce6832f296" PRIMARY KEY ("business_campaign_id", "business_reward_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad3ec01f4743813c9f9c6021a8" ON "business_campaign_rewards" ("business_campaign_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92d2d7ae2c0508b69e4b13f943" ON "business_campaign_rewards" ("business_reward_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "business_campaign_platform_rewards" ("business_campaign_id" uuid NOT NULL, "reward_id" uuid NOT NULL, CONSTRAINT "PK_5570b1a8dfa65a0a8de1fa955ba" PRIMARY KEY ("business_campaign_id", "reward_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7850687f0f658a4a9dadd34cb2" ON "business_campaign_platform_rewards" ("business_campaign_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e72c98b9b85c015f0a350d353" ON "business_campaign_platform_rewards" ("reward_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "business_campaign_deals" ("business_campaign_id" uuid NOT NULL, "deal_id" uuid NOT NULL, CONSTRAINT "PK_6afbbb8cec0df42084361d70892" PRIMARY KEY ("business_campaign_id", "deal_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9e807031e88a58125f21afdcf" ON "business_campaign_deals" ("business_campaign_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cddf3de2ea18f5a492c3d49268" ON "business_campaign_deals" ("deal_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "business_stamp_reward_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "image" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "regular_points_ratio" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "matching_points_ratio" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "terms_and_conditions" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "is_public" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "reward_source" SET DEFAULT 'business'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "audience" SET DEFAULT 'all business'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP CONSTRAINT "UQ_6fa61e2a94543c1efa5b2572a21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "uniqueCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "uniqueCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD CONSTRAINT "UQ_6fa61e2a94543c1efa5b2572a21" UNIQUE ("uniqueCode")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "name" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "campaign_message"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "campaign_message" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "start_date" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "end_date" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."business_campaigns_audience_type_enum" RENAME TO "business_campaigns_audience_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_audience_type_enum" AS ENUM('all', 'members', 'badge_level', 'target_wishlist')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "audience_type" TYPE "public"."business_campaigns_audience_type_enum" USING "audience_type"::"text"::"public"."business_campaigns_audience_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "audience_type" SET DEFAULT 'all'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_campaigns_audience_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "audience_type" SET DEFAULT 'all'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "banner_url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "business_campaigns" SET "signUpPoint" = 0 WHERE "signUpPoint" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "signUpPoint" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "signUpPoint" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `UPDATE "business_campaigns" SET "initial_audience_size" = 0 WHERE "initial_audience_size" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "initial_audience_size" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "initial_audience_size" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "earn_point_page_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "earn_point_page_description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "redeem_reward_page_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "redeem_reward_page_description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "contact_us_page_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "contact_us_page_description" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum" RENAME TO "point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum" AS ENUM('EARN', 'REDEEM', 'MATCHING', 'PURCHASED_EXTRA', 'STAMP_EARN', 'STAMP_REDEEM', 'BUSINESS_STAMP_SPENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum" USING "type"::"text"::"public"."point_histories_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."campaigns_audience_type_enum" RENAME TO "campaigns_audience_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_audience_type_enum" AS ENUM('all', 'members', 'badge_level', 'target_wishlist')`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "audience_type" TYPE "public"."campaigns_audience_type_enum" USING "audience_type"::"text"::"public"."campaigns_audience_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."campaigns_audience_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" ADD CONSTRAINT "FK_f8aea75dd221e6513e6253f126a" FOREIGN KEY ("business_campaign_id") REFERENCES "business_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_rewards" ADD CONSTRAINT "FK_ad3ec01f4743813c9f9c6021a86" FOREIGN KEY ("business_campaign_id") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_rewards" ADD CONSTRAINT "FK_92d2d7ae2c0508b69e4b13f9431" FOREIGN KEY ("business_reward_id") REFERENCES "business_reward"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_platform_rewards" ADD CONSTRAINT "FK_7850687f0f658a4a9dadd34cb24" FOREIGN KEY ("business_campaign_id") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_platform_rewards" ADD CONSTRAINT "FK_6e72c98b9b85c015f0a350d3534" FOREIGN KEY ("reward_id") REFERENCES "reward"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_deals" ADD CONSTRAINT "FK_d9e807031e88a58125f21afdcf6" FOREIGN KEY ("business_campaign_id") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_deals" ADD CONSTRAINT "FK_cddf3de2ea18f5a492c3d492682" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaign_deals" DROP CONSTRAINT "FK_cddf3de2ea18f5a492c3d492682"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_deals" DROP CONSTRAINT "FK_d9e807031e88a58125f21afdcf6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_platform_rewards" DROP CONSTRAINT "FK_6e72c98b9b85c015f0a350d3534"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_platform_rewards" DROP CONSTRAINT "FK_7850687f0f658a4a9dadd34cb24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_rewards" DROP CONSTRAINT "FK_92d2d7ae2c0508b69e4b13f9431"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_rewards" DROP CONSTRAINT "FK_ad3ec01f4743813c9f9c6021a86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" DROP CONSTRAINT "FK_f8aea75dd221e6513e6253f126a"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_audience_type_enum_old" AS ENUM('badge_level', 'members', 'target_wishlist')`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "audience_type" TYPE "public"."campaigns_audience_type_enum_old" USING "audience_type"::"text"::"public"."campaigns_audience_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."campaigns_audience_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."campaigns_audience_type_enum_old" RENAME TO "campaigns_audience_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum_old" AS ENUM('EARN', 'MATCHING', 'PURCHASED_EXTRA', 'REDEEM', 'STAMP_EARN', 'STAMP_REDEEM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum_old" USING "type"::"text"::"public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."point_histories_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum_old" RENAME TO "point_histories_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "contact_us_page_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "contact_us_page_description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "redeem_reward_page_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "redeem_reward_page_description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "earn_point_page_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "earn_point_page_description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "initial_audience_size" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "initial_audience_size" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "signUpPoint" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "signUpPoint" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "banner_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "audience_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_audience_type_enum_old" AS ENUM('badge_level', 'members', 'target_wishlist')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "audience_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "audience_type" TYPE "public"."business_campaigns_audience_type_enum_old" USING "audience_type"::"text"::"public"."business_campaigns_audience_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_campaigns_audience_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."business_campaigns_audience_type_enum_old" RENAME TO "business_campaigns_audience_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "end_date" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "start_date" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "campaign_message"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "campaign_message" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP CONSTRAINT "UQ_6fa61e2a94543c1efa5b2572a21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "uniqueCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "uniqueCode" character varying(9) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD CONSTRAINT "UQ_6fa61e2a94543c1efa5b2572a21" UNIQUE ("uniqueCode")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "audience" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "reward_source" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "is_public"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "terms_and_conditions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "matching_points_ratio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "regular_points_ratio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "image"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "business_stamp_reward_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cddf3de2ea18f5a492c3d49268"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d9e807031e88a58125f21afdcf"`,
    );
    await queryRunner.query(`DROP TABLE "business_campaign_deals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6e72c98b9b85c015f0a350d353"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7850687f0f658a4a9dadd34cb2"`,
    );
    await queryRunner.query(`DROP TABLE "business_campaign_platform_rewards"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92d2d7ae2c0508b69e4b13f943"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad3ec01f4743813c9f9c6021a8"`,
    );
    await queryRunner.query(`DROP TABLE "business_campaign_rewards"`);
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" RENAME COLUMN "business_campaign_id" TO "businessCampaignId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73556eda143a5e520fa22a5b92" ON "business_campaigns" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD CONSTRAINT "FK_c799f1f2b4aa21f795b5dffc4a2" FOREIGN KEY ("business_stamp_reward_id") REFERENCES "business_stamp_rewards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" ADD CONSTRAINT "FK_8a615ddc1d1994d3da708a0ea9f" FOREIGN KEY ("businessCampaignId") REFERENCES "business_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
