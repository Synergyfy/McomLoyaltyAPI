import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateParticipantProfileFields1765309585702 implements MigrationInterface {
    name = 'UpdateParticipantProfileFields1765309585702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "point_histories" ADD "actionKey" character varying`);
        await queryRunner.query(`ALTER TABLE "participants" ADD "phoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "participants" ADD "isPhoneVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "participants" ADD "dob" date`);
        await queryRunner.query(`ALTER TABLE "participants" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "participants" ADD "profilePhoto" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "profilePhoto"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "dob"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "isPhoneVerified"`);
        await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "point_histories" DROP COLUMN "actionKey"`);
    }

}
