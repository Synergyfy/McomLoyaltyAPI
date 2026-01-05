import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTierDates1767142885117 implements MigrationInterface {
  name = "RemoveTierDates1767142885117";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "start_date"`);
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "end_date"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tier" ADD "end_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tier" ADD "start_date" TIMESTAMP`);
  }
}
