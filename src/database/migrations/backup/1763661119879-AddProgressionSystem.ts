import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProgressionSystem1763661119879 implements MigrationInterface {
  name = "AddProgressionSystem1763661119879";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "participants" DROP CONSTRAINT "FK_20fa97509130812c6629379c6f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP CONSTRAINT "FK_bf721a8f3d1907805862e914d34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" RENAME COLUMN "reputationLevelId" TO "reputation_points"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."progression_history_entitytype_enum" AS ENUM('BUSINESS', 'CUSTOMER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."progression_history_reason_enum" AS ENUM('AUTOMATIC_UPGRADE', 'AUTOMATIC_DOWNGRADE', 'MANUAL_OVERRIDE', 'INITIAL_ASSIGNMENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "progression_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "entityType" "public"."progression_history_entitytype_enum" NOT NULL, "entityId" character varying NOT NULL, "fromLevelId" character varying, "fromLevelName" character varying, "toLevelId" character varying NOT NULL, "toLevelName" character varying NOT NULL, "reason" "public"."progression_history_reason_enum" NOT NULL, "changedBy" character varying, CONSTRAINT "PK_3dd76077625603c704c8edc62a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_badges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "minPoints" integer NOT NULL DEFAULT '0', "maxPoints" integer, "minCampaignsJoined" integer NOT NULL DEFAULT '0', "maxCampaignsJoined" integer, "privileges" text, "description" text, CONSTRAINT "UQ_229d43a7027d3b928e66f33c3fd" UNIQUE ("name"), CONSTRAINT "PK_3439b55902f6dbc83e65297ab1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_progressions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "participantId" uuid NOT NULL, "currentBadgeId" uuid NOT NULL, "currentPoints" integer NOT NULL DEFAULT '0', "totalCampaignsJoined" integer NOT NULL DEFAULT '0', "isManualOverride" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_8293027d925b000ddc8bd9158e" UNIQUE ("participantId"), CONSTRAINT "PK_6785df70a7a3183a24ec8daa41d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "minPoints" integer NOT NULL DEFAULT '0', "maxPoints" integer, "minCampaigns" integer NOT NULL DEFAULT '0', "maxCampaigns" integer, "privileges" text, "description" text, CONSTRAINT "UQ_4dd37adc59475fc6fb959d47016" UNIQUE ("name"), CONSTRAINT "PK_eb43aadba01a5e666f392d805b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_progressions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "businessId" uuid NOT NULL, "currentLevelId" uuid NOT NULL, "currentPoints" integer NOT NULL DEFAULT '0', "totalCampaignsCreated" integer NOT NULL DEFAULT '0', "isManualOverride" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_ba15b7b44d94c766acaf880c8b" UNIQUE ("businessId"), CONSTRAINT "PK_1fffe1b7c99509091669e8904ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "reputationLevelId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "reputation_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "reputation_points" numeric NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_progressions" ADD CONSTRAINT "FK_8293027d925b000ddc8bd9158e4" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_progressions" ADD CONSTRAINT "FK_80b9e1e81df9c3ffe74a724df4f" FOREIGN KEY ("currentBadgeId") REFERENCES "customer_badges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_progressions" ADD CONSTRAINT "FK_ba15b7b44d94c766acaf880c8bd" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_progressions" ADD CONSTRAINT "FK_2cb909a43fb66235d14517ebf2d" FOREIGN KEY ("currentLevelId") REFERENCES "business_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_progressions" DROP CONSTRAINT "FK_2cb909a43fb66235d14517ebf2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_progressions" DROP CONSTRAINT "FK_ba15b7b44d94c766acaf880c8bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_progressions" DROP CONSTRAINT "FK_80b9e1e81df9c3ffe74a724df4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_progressions" DROP CONSTRAINT "FK_8293027d925b000ddc8bd9158e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "reputation_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "reputation_points" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "reputationLevelId" uuid`,
    );
    await queryRunner.query(`DROP TABLE "business_progressions"`);
    await queryRunner.query(`DROP TABLE "business_levels"`);
    await queryRunner.query(`DROP TABLE "customer_progressions"`);
    await queryRunner.query(`DROP TABLE "customer_badges"`);
    await queryRunner.query(`DROP TABLE "progression_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."progression_history_reason_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."progression_history_entitytype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" RENAME COLUMN "reputation_points" TO "reputationLevelId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD CONSTRAINT "FK_bf721a8f3d1907805862e914d34" FOREIGN KEY ("reputationLevelId") REFERENCES "reputation_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD CONSTRAINT "FK_20fa97509130812c6629379c6f8" FOREIGN KEY ("reputationLevelId") REFERENCES "reputation_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
