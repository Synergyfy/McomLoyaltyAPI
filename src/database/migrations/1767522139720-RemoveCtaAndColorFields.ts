import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCtaAndColorFields1767522139720
  implements MigrationInterface
{
  name = "RemoveCtaAndColorFields1767522139720";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "cta_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "cta_background_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "cta_text_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "text_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "background_color"`,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "cta_text"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "cta_background_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "cta_text_color"`,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "text_color"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "background_color"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "background_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "text_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "cta_text_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "cta_background_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "cta_text" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "background_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "text_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "cta_text_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "cta_background_color" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "cta_text" character varying NOT NULL`,
    );
  }
}
