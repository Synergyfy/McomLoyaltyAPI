import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupCircleMessaging1766082083069 implements MigrationInterface {
  name = "GroupCircleMessaging1766082083069";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."group_messages_type_enum" AS ENUM('GROUP', 'DIRECT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" ADD "type" "public"."group_messages_type_enum" NOT NULL DEFAULT 'GROUP'`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" ADD "recipientId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" ADD "recipientName" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_677abb51474fc663b99d40c27e" ON "group_messages" ("groupCircleId", "senderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26ac75f0922a8be769fcc50a7f" ON "group_messages" ("groupCircleId", "recipientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_916408bec34e41a66ec98ae3c5" ON "group_messages" ("groupCircleId", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ddfea96e8007e951e7d80b01e" ON "group_messages" ("groupCircleId", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ddfea96e8007e951e7d80b01e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_916408bec34e41a66ec98ae3c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26ac75f0922a8be769fcc50a7f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_677abb51474fc663b99d40c27e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" DROP COLUMN "recipientName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" DROP COLUMN "recipientId"`,
    );
    await queryRunner.query(`ALTER TABLE "group_messages" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."group_messages_type_enum"`);
  }
}
