import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePostalCodeRequired1766003311493 implements MigrationInterface {
    name = 'MakePostalCodeRequired1766003311493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "businesses" SET "postalCode" = '00000' WHERE "postalCode" IS NULL`);
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "postalCode" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "postalCode" DROP NOT NULL`);
    }

}
