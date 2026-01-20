import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMatchingPointCampaignSupport1767806884215
  implements MigrationInterface
{
  name = "AddMatchingPointCampaignSupport1767806884215";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD "beneficiary_business_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."business_campaigns_campaign_type_enum" RENAME TO "business_campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_campaigns_campaign_type_enum" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion', 'matching_point')`,
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
      `ALTER TYPE "public"."campaigns_campaign_type_enum" RENAME TO "campaigns_campaign_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_campaign_type_enum" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion', 'matching_point')`,
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
      `ALTER TABLE "point_histories" ADD CONSTRAINT "FK_1e21e76809f1e6adef91882fc63" FOREIGN KEY ("beneficiary_business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP CONSTRAINT "FK_1e21e76809f1e6adef91882fc63"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."campaigns_campaign_type_enum_old" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion')`,
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
      `CREATE TYPE "public"."business_campaigns_campaign_type_enum_old" AS ENUM('qr_code', 'referral', 'social_or_email', 'special_occasion')`,
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
      `ALTER TABLE "point_histories" DROP COLUMN "beneficiary_business_id"`,
    );
  }
}
