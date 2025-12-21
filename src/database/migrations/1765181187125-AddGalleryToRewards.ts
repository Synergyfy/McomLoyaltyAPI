import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGalleryToRewards1765181187125 implements MigrationInterface {
  name = "AddGalleryToRewards1765181187125";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reward" ADD "gallery" text array`);
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "gallery" text array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "gallery"`,
    );
    await queryRunner.query(`ALTER TABLE "reward" DROP COLUMN "gallery"`);
  }
}
