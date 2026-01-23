import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProvisionTable1769201895388 implements MigrationInterface {
    name = 'AddProvisionTable1769201895388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."provision_type_enum" AS ENUM('TIER_ACCESS')`);
        await queryRunner.query(`CREATE TABLE "provision" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "code" character varying NOT NULL, "type" "public"."provision_type_enum" NOT NULL, "payload" jsonb, "isRedeemed" boolean NOT NULL DEFAULT false, "redeemedAt" TIMESTAMP, "redeemedByUserId" character varying, "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_c5095ff955d687833839caaad71" UNIQUE ("code"), CONSTRAINT "PK_2065a094470ebb8a44a869fbe40" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "provision"`);
        await queryRunner.query(`DROP TYPE "public"."provision_type_enum"`);
    }

}
