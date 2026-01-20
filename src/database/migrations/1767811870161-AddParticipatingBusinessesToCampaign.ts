import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParticipatingBusinessesToCampaign1767811870161
  implements MigrationInterface
{
  name = "AddParticipatingBusinessesToCampaign1767811870161";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "business_campaign_participants" ("business_campaign_id" uuid NOT NULL, "business_id" uuid NOT NULL, CONSTRAINT "PK_683968ad4e8aff03ec83230b050" PRIMARY KEY ("business_campaign_id", "business_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3baa2dcd01b6870568bab69413" ON "business_campaign_participants" ("business_campaign_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f442ab79870094aec0c493f57" ON "business_campaign_participants" ("business_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_participants" ADD CONSTRAINT "FK_3baa2dcd01b6870568bab694139" FOREIGN KEY ("business_campaign_id") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_participants" ADD CONSTRAINT "FK_1f442ab79870094aec0c493f578" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaign_participants" DROP CONSTRAINT "FK_1f442ab79870094aec0c493f578"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaign_participants" DROP CONSTRAINT "FK_3baa2dcd01b6870568bab694139"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f442ab79870094aec0c493f57"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3baa2dcd01b6870568bab69413"`,
    );
    await queryRunner.query(`DROP TABLE "business_campaign_participants"`);
  }
}
