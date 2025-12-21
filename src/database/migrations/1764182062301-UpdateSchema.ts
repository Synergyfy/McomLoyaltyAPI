import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1764182062301 implements MigrationInterface {
  name = "UpdateSchema1764182062301";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."wishlist_items_relationship_enum" AS ENUM('FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'HUSBAND', 'WIFE', 'OTHERS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wishlist_items_occasion_enum" AS ENUM('BIRTHDAY', 'ANNIVERSARY', 'NONE', 'CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wishlist_items_season_enum" AS ENUM('AUTUMN', 'WINTER', 'SUMMER', 'SPRING', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wishlist_items_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wishlist_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "itemName" character varying NOT NULL, "itemImageUrl" character varying, "isForThirdParty" boolean NOT NULL DEFAULT false, "recipientName" character varying, "recipientEmail" character varying, "recipientPhone" character varying, "relationship" "public"."wishlist_items_relationship_enum", "occasion" "public"."wishlist_items_occasion_enum" NOT NULL DEFAULT 'NONE', "season" "public"."wishlist_items_season_enum" NOT NULL DEFAULT 'NONE', "targetDate" date, "priority" "public"."wishlist_items_priority_enum" NOT NULL DEFAULT 'MEDIUM', "marketingConsent" boolean NOT NULL, "category_id" uuid, "participant_id" uuid, CONSTRAINT "PK_0bd52924a97cda208ed2a07bd69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "wishlist_aggregates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "itemName" character varying NOT NULL, "audienceSize" integer NOT NULL, "targetDates" date array NOT NULL, "category_id" uuid, CONSTRAINT "PK_107dc3faa77c716105adf733538" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99a0046c0d4150561cd0cb9e7a" ON "wishlist_aggregates" ("itemName", "category_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_b0dc20307c9cc108607c814bd4f" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_6228179a86266a7b7bb3ab8642d" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_aggregates" ADD CONSTRAINT "FK_d574a7d8bc02a403a3945668a24" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wishlist_aggregates" DROP CONSTRAINT "FK_d574a7d8bc02a403a3945668a24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_6228179a86266a7b7bb3ab8642d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_b0dc20307c9cc108607c814bd4f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99a0046c0d4150561cd0cb9e7a"`,
    );
    await queryRunner.query(`DROP TABLE "wishlist_aggregates"`);
    await queryRunner.query(`DROP TABLE "wishlist_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."wishlist_items_priority_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."wishlist_items_season_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."wishlist_items_occasion_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wishlist_items_relationship_enum"`,
    );
  }
}
