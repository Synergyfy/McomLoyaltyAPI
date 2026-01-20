import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDealAnalytics1767982090094 implements MigrationInterface {
  name = "CreateDealAnalytics1767982090094";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "deal_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "os" character varying, "device" character varying, "browser" character varying, "ip_hash" character varying, "time_spent_seconds" integer NOT NULL DEFAULT '0', "deal_id" uuid, CONSTRAINT "PK_deal_analytics_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "deal_analytics" ADD CONSTRAINT "FK_deal_analytics_deal_id" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_analytics" DROP CONSTRAINT "FK_deal_analytics_deal_id"`,
    );
    await queryRunner.query(`DROP TABLE "deal_analytics"`);
  }
}
