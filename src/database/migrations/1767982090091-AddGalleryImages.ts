import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGalleryImages1767982090091 implements MigrationInterface {
    name = 'AddGalleryImages1767982090091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" ADD "galleryImages" text array NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN "galleryImages"`);
    }

}
