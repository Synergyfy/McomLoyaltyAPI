import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRewardStampPlurals1766789734000
    implements MigrationInterface {
    name = "UpdateRewardStampPlurals1766789734000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "business_reward" RENAME COLUMN "stamp_required" TO "stamps_required"`,
        );
        await queryRunner.query(
            `ALTER TABLE "reward" RENAME COLUMN "max_stamp_required" TO "max_stamps_required"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "reward" RENAME COLUMN "max_stamps_required" TO "max_stamp_required"`,
        );
        await queryRunner.query(
            `ALTER TABLE "business_reward" RENAME COLUMN "stamps_required" TO "stamp_required"`,
        );
    }
}
