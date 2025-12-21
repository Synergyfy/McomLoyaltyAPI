import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParticipantProgression1765211912865
  implements MigrationInterface
{
  name = "AddParticipantProgression1765211912865";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "participant_badges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "minPoints" integer NOT NULL DEFAULT '0', "maxPoints" integer, "privileges" text, "color" character varying, CONSTRAINT "UQ_62bfbbc3a804eea7d0d41692cda" UNIQUE ("name"), CONSTRAINT "PK_7107483532a7263f19fc848876e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "currentBadgeId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD CONSTRAINT "FK_80457572ee15038188db8d430ed" FOREIGN KEY ("currentBadgeId") REFERENCES "participant_badges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "participants" DROP CONSTRAINT "FK_80457572ee15038188db8d430ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "currentBadgeId"`,
    );
    await queryRunner.query(`DROP TABLE "participant_badges"`);
  }
}
