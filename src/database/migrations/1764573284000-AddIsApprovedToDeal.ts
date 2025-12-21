import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsApprovedToDeal1764573284000 implements MigrationInterface {
  name = "AddIsApprovedToDeal1764573284000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "isApproved" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "isApproved"`);
  }
}
