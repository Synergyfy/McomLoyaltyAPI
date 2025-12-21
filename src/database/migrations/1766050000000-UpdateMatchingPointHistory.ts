import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMatchingPointHistory1766050000000
  implements MigrationInterface
{
  name = "UpdateMatchingPointHistory1766050000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" ADD "balance_after" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matching_point_history_business_created_at" ON "matching_point_history" ("businessId", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matching_point_history_business_activity_created_at" ON "matching_point_history" ("businessId", "activity_type", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matching_point_history_description" ON "matching_point_history" ("description")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_matching_point_history_description"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_matching_point_history_business_activity_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_matching_point_history_business_created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matching_point_history" DROP COLUMN "balance_after"`,
    );
  }
}
