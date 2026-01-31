import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEnumAndPendingChanges1769897862194 implements MigrationInterface {
    name = 'SyncEnumAndPendingChanges1769897862194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."help_requests_type_enum" AS ENUM('CAMPAIGN_CREATION', 'CAMPAIGN_EDIT', 'CAMPAIGN_ARCHIVE', 'REWARD_CREATION', 'REWARD_EDIT', 'REWARD_ARCHIVE', 'TIER_MANAGEMENT', 'ANALYTICS_REPORT', 'GENERAL_SUPPORT')`);
        await queryRunner.query(`CREATE TABLE "help_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requesterId" character varying NOT NULL, "type" "public"."help_requests_type_enum" NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2990700cfcb0ce6fbdd7b3d532f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "help_requests"`);
        await queryRunner.query(`DROP TYPE "public"."help_requests_type_enum"`);
    }

}
