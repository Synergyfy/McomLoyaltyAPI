import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCampaignFromWishlist1764205805229
  implements MigrationInterface
{
  name = "CreateCampaignFromWishlist1764205805229";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "initial_audience_size" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "wishlist_aggregate_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "initial_audience_size" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "wishlist_aggregate_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "payment_history" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD CONSTRAINT "FK_934e20da63f23c2fd4a87fd3c51" FOREIGN KEY ("wishlist_aggregate_id") REFERENCES "wishlist_aggregates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_fff9bbb193c36bc0b321fb56fe8" FOREIGN KEY ("wishlist_aggregate_id") REFERENCES "wishlist_aggregates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" ADD CONSTRAINT "FK_87a6f5afc86958a2206e337065f" FOREIGN KEY ("user_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP CONSTRAINT "FK_87a6f5afc86958a2206e337065f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_fff9bbb193c36bc0b321fb56fe8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP CONSTRAINT "FK_934e20da63f23c2fd4a87fd3c51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" ADD "user_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "wishlist_aggregate_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "initial_audience_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "wishlist_aggregate_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "initial_audience_size"`,
    );
  }
}
