import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationEntity1764877216698
  implements MigrationInterface
{
  name = "CreateNotificationEntity1764877216698";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('POINT_AWARDED', 'REWARD_REDEEMED', 'ALLOWANCE_WARNING', 'CAMPAIGN_JOINED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_recipient_type_enum" AS ENUM('BUSINESS', 'USER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "message" character varying NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "recipient_type" "public"."notifications_recipient_type_enum" NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "related_entity_id" character varying, "business_id" uuid, "participant_id" uuid, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_b1b5043ada10de525123ccdd40e" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_92bb370f296793f045dde37d7f8" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_92bb370f296793f045dde37d7f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_b1b5043ada10de525123ccdd40e"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."notifications_recipient_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
