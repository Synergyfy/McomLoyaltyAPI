import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkDealToCampaigns1764579700880 implements MigrationInterface {
  name = "LinkDealToCampaigns1764579700880";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "deal_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "rating" integer NOT NULL, "comment" text, "dealId" uuid, "userId" uuid, CONSTRAINT "PK_3dc23b9a3035ae7999e053455bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deal_redemptions_status_enum" AS ENUM('PENDING', 'REDEEMED', 'CANCELLED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "deal_redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."deal_redemptions_status_enum" NOT NULL DEFAULT 'PENDING', "redemptionCode" character varying NOT NULL, "redeemedAt" TIMESTAMP, "dealId" uuid, "userId" uuid, CONSTRAINT "PK_7a670251be28b9e84b14624a9b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_29eb82635dcbcf4b09d0041bf7" ON "deal_redemptions" ("redemptionCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "business_campaigns_deals_deals" ("businessCampaignsId" uuid NOT NULL, "dealsId" uuid NOT NULL, CONSTRAINT "PK_dc4259ada604ffa1246bb8c18f6" PRIMARY KEY ("businessCampaignsId", "dealsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fde23643d08bc93f96d3a30404" ON "business_campaigns_deals_deals" ("businessCampaignsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bba2536158421c4c2e2637f314" ON "business_campaigns_deals_deals" ("dealsId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "campaigns_deals_deals" ("campaignsId" uuid NOT NULL, "dealsId" uuid NOT NULL, CONSTRAINT "PK_5156f7e54208eb9819733d044b3" PRIMARY KEY ("campaignsId", "dealsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b85044c028f581410ffbb4c33" ON "campaigns_deals_deals" ("campaignsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa45a7eb0521e78a91d16bb0f8" ON "campaigns_deals_deals" ("dealsId") `,
    );
    await queryRunner.query(`ALTER TABLE "point_histories" ADD "deal_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "shortDescription" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deals_type_enum" AS ENUM('DISCOUNT', 'BUNDLE', 'BOGO', 'FLASH_SALE', 'GIFT_CARD', 'SERVICE_PACKAGE', 'INTRO_OFFER', 'SEASONAL', 'EARLY_BIRD', 'REFERRAL_DEAL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "type" "public"."deals_type_enum" NOT NULL DEFAULT 'DISCOUNT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "images" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "originalPrice" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "dealPrice" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "deals" ADD "maxQuantity" integer`);
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "soldQuantity" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "perCustomerLimit" integer`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deals_redemptionmethod_enum" AS ENUM('QR_SCAN', 'VOUCHER_CODE', 'E_CARD', 'APPOINTMENT', 'ONLINE_CHECKOUT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "redemptionMethod" "public"."deals_redemptionmethod_enum" NOT NULL DEFAULT 'QR_SCAN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "location" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "isFeatured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deals_visibility_enum" AS ENUM('PUBLIC', 'PRIVATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "visibility" "public"."deals_visibility_enum" NOT NULL DEFAULT 'PUBLIC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "isReward" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "deals" ADD "pointsCost" integer`);
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "pointsEarned" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."deals_status_enum" RENAME TO "deals_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deals_status_enum" AS ENUM('approved', 'declined', 'pending', 'flagged')`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ALTER COLUMN "status" TYPE "public"."deals_status_enum" USING "status"::"text"::"public"."deals_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."deals_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD CONSTRAINT "FK_bdfc1d86f558e832b6a2d3cff9f" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" ADD CONSTRAINT "FK_5e96e2fd37bd52a05f390594c85" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" ADD CONSTRAINT "FK_8d4ad9a806147e82074af6a3f22" FOREIGN KEY ("userId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_redemptions" ADD CONSTRAINT "FK_ba76ae2ffce79ad290c208fb81c" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_redemptions" ADD CONSTRAINT "FK_3acda0e5c9ae0ca03c08f256e6f" FOREIGN KEY ("userId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_deals_deals" ADD CONSTRAINT "FK_fde23643d08bc93f96d3a304046" FOREIGN KEY ("businessCampaignsId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_deals_deals" ADD CONSTRAINT "FK_bba2536158421c4c2e2637f3147" FOREIGN KEY ("dealsId") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns_deals_deals" ADD CONSTRAINT "FK_5b85044c028f581410ffbb4c333" FOREIGN KEY ("campaignsId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns_deals_deals" ADD CONSTRAINT "FK_aa45a7eb0521e78a91d16bb0f81" FOREIGN KEY ("dealsId") REFERENCES "deals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns_deals_deals" DROP CONSTRAINT "FK_aa45a7eb0521e78a91d16bb0f81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns_deals_deals" DROP CONSTRAINT "FK_5b85044c028f581410ffbb4c333"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_deals_deals" DROP CONSTRAINT "FK_bba2536158421c4c2e2637f3147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_deals_deals" DROP CONSTRAINT "FK_fde23643d08bc93f96d3a304046"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_redemptions" DROP CONSTRAINT "FK_3acda0e5c9ae0ca03c08f256e6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_redemptions" DROP CONSTRAINT "FK_ba76ae2ffce79ad290c208fb81c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" DROP CONSTRAINT "FK_8d4ad9a806147e82074af6a3f22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_reviews" DROP CONSTRAINT "FK_5e96e2fd37bd52a05f390594c85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP CONSTRAINT "FK_bdfc1d86f558e832b6a2d3cff9f"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deals_status_enum_old" AS ENUM('approved', 'declined', 'pending')`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ALTER COLUMN "status" TYPE "public"."deals_status_enum_old" USING "status"::"text"::"public"."deals_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."deals_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."deals_status_enum_old" RENAME TO "deals_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "pointsEarned"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "pointsCost"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "isReward"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "visibility"`);
    await queryRunner.query(`DROP TYPE "public"."deals_visibility_enum"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "isFeatured"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "location"`);
    await queryRunner.query(
      `ALTER TABLE "deals" DROP COLUMN "redemptionMethod"`,
    );
    await queryRunner.query(`DROP TYPE "public"."deals_redemptionmethod_enum"`);
    await queryRunner.query(
      `ALTER TABLE "deals" DROP COLUMN "perCustomerLimit"`,
    );
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "soldQuantity"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "maxQuantity"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "dealPrice"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "originalPrice"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "images"`);
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."deals_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "deals" DROP COLUMN "shortDescription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP COLUMN "deal_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa45a7eb0521e78a91d16bb0f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b85044c028f581410ffbb4c33"`,
    );
    await queryRunner.query(`DROP TABLE "campaigns_deals_deals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bba2536158421c4c2e2637f314"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fde23643d08bc93f96d3a30404"`,
    );
    await queryRunner.query(`DROP TABLE "business_campaigns_deals_deals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_29eb82635dcbcf4b09d0041bf7"`,
    );
    await queryRunner.query(`DROP TABLE "deal_redemptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."deal_redemptions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "deal_reviews"`);
  }
}
