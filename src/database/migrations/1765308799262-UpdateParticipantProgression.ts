import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateParticipantProgression1765308799262
  implements MigrationInterface
{
  name = "UpdateParticipantProgression1765308799262";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "earning_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "key" character varying NOT NULL, "points" integer NOT NULL DEFAULT '0', "description" character varying, "actionParameters" json, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2a6c7fd286c31d35a80ad51581f" UNIQUE ("key"), CONSTRAINT "PK_8d9b79ca721fa66511032b82c0f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" ADD "priority" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" ADD CONSTRAINT "UQ_b50ee063306e703513ddb849b99" UNIQUE ("priority")`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" ADD "multiplier" double precision NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" ADD "benefits" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD "transaction_id" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_payment_provider_enum" AS ENUM('stripe', 'paypal')`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD "payment_provider" "public"."membership_payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" DROP COLUMN "payment_provider"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_payment_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" DROP COLUMN "transaction_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" DROP COLUMN "benefits"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" DROP COLUMN "multiplier"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" DROP CONSTRAINT "UQ_b50ee063306e703513ddb849b99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_badges" DROP COLUMN "priority"`,
    );
    await queryRunner.query(`DROP TABLE "earning_actions"`);
  }
}
