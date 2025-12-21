import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNetworkTable1765545339319 implements MigrationInterface {
  name = "CreateNetworkTable1765545339319";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."networks_locationtag_enum" AS ENUM('nearby', 'hyperlocal', 'national')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."networks_relationshiptag_enum" AS ENUM('partner', 'customer', 'supplier', 'affiliate')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."networks_status_enum" AS ENUM('pending', 'accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "networks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "fullName" character varying NOT NULL, "businessName" character varying, "email" character varying, "phone" character varying NOT NULL, "locationTag" "public"."networks_locationtag_enum" NOT NULL, "relationshipTag" "public"."networks_relationshiptag_enum" NOT NULL, "status" "public"."networks_status_enum" NOT NULL DEFAULT 'pending', "permission" character varying NOT NULL DEFAULT 'pending', "businessId" uuid, CONSTRAINT "PK_61b1ee921bf79550d9d4742b9f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e0f07f85039853224f2edfb8a7" ON "networks" ("businessId", "phone") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b144c7f2cd40f263b0fec0abf7" ON "networks" ("businessId", "email") WHERE "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD CONSTRAINT "FK_d480f22678b8d137ceee475ff6e" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "networks" DROP CONSTRAINT "FK_d480f22678b8d137ceee475ff6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b144c7f2cd40f263b0fec0abf7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0f07f85039853224f2edfb8a7"`,
    );
    await queryRunner.query(`DROP TABLE "networks"`);
    await queryRunner.query(`DROP TYPE "public"."networks_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."networks_relationshiptag_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."networks_locationtag_enum"`);
  }
}
