import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerToBusiness1765446141855 implements MigrationInterface {
  name = "AddBannerToBusiness1765446141855";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "banner" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "banner"`);
  }
}
