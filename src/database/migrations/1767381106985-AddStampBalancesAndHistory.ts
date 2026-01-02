import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStampBalancesAndHistory1767381106985 implements MigrationInterface {
    name = 'AddStampBalancesAndHistory1767381106985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participant_campaign_balances" ADD "stamp_balance" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "point_histories" ADD "stamps" integer`);
        await queryRunner.query(`ALTER TABLE "point_histories" ALTER COLUMN "points" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "point_histories" ALTER COLUMN "points" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "point_histories" DROP COLUMN "stamps"`);
        await queryRunner.query(`ALTER TABLE "participant_campaign_balances" DROP COLUMN "stamp_balance"`);
    }

}
