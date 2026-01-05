import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCampaignTiersAndRemoveDates1767146909316
  implements MigrationInterface
{
  name = "UpdateCampaignTiersAndRemoveDates1767146909316";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_8341d5be1333c963dc4cbc50f6d"`,
    );
    await queryRunner.query(
      `CREATE TABLE "campaign_target_tiers" ("campaignsId" uuid NOT NULL, "tierId" uuid NOT NULL, CONSTRAINT "PK_b47fd6f439dbd32e70564c974ce" PRIMARY KEY ("campaignsId", "tierId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c9cba28556ff27c94f3a70265" ON "campaign_target_tiers" ("campaignsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3cb6e77a36aee16df2e621f229" ON "campaign_target_tiers" ("tierId") `,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "start_date"`);
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "end_date"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "target_tier_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_target_tiers" ADD CONSTRAINT "FK_2c9cba28556ff27c94f3a702650" FOREIGN KEY ("campaignsId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_target_tiers" ADD CONSTRAINT "FK_3cb6e77a36aee16df2e621f2294" FOREIGN KEY ("tierId") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaign_target_tiers" DROP CONSTRAINT "FK_3cb6e77a36aee16df2e621f2294"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaign_target_tiers" DROP CONSTRAINT "FK_2c9cba28556ff27c94f3a702650"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "target_tier_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "end_date" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "start_date" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cb6e77a36aee16df2e621f229"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c9cba28556ff27c94f3a70265"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_target_tiers"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_8341d5be1333c963dc4cbc50f6d" FOREIGN KEY ("target_tier_id") REFERENCES "tier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
