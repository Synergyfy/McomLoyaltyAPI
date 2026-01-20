import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1767730458013 implements MigrationInterface {
  name = "SchemaUpdate1767730458013";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "participants_business_campaigns_business_campaigns" DROP CONSTRAINT "FK_053ab1c92cfc0a328e92f82e874"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants_business_campaigns_business_campaigns" ADD CONSTRAINT "FK_053ab1c92cfc0a328e92f82e874" FOREIGN KEY ("businessCampaignsId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "participants_business_campaigns_business_campaigns" DROP CONSTRAINT "FK_053ab1c92cfc0a328e92f82e874"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants_business_campaigns_business_campaigns" ADD CONSTRAINT "FK_053ab1c92cfc0a328e92f82e874" FOREIGN KEY ("businessCampaignsId") REFERENCES "business_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
