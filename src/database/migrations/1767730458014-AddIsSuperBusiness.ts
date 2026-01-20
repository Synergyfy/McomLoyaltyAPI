import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsSuperBusiness1767730458014 implements MigrationInterface {
  name = "AddIsSuperBusiness1767730458014";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "isSuperBusiness" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "isSuperBusiness"`,
    );
  }
}
