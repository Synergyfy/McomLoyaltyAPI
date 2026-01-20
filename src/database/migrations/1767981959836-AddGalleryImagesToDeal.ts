import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGalleryImagesToDeal1767981959836 implements MigrationInterface {
  name = "AddGalleryImagesToDeal1767981959836";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" ADD "galleryImages" text array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "galleryImages"`);
  }
}
