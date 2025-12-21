import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHasSharingPermission1765617061613
  implements MigrationInterface
{
  name = "AddHasSharingPermission1765617061613";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "hasSharingPermission" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "hasSharingPermission"`,
    );
  }
}
