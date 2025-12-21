import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLibraryAssets1766326172566 implements MigrationInterface {
  name = "CreateLibraryAssets1766326172566";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."library_assets_type_enum" AS ENUM('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."library_assets_ownertype_enum" AS ENUM('BUSINESS', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "library_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "url" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying, "type" "public"."library_assets_type_enum" NOT NULL DEFAULT 'IMAGE', "ownerType" "public"."library_assets_ownertype_enum" NOT NULL, "businessId" uuid, "sectorId" uuid, "categoryId" uuid, "subCategoryId" uuid, CONSTRAINT "PK_8e79131044caf3a31a4f098b647" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_923e9e7e76a8363e55b0794025" ON "library_assets" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f0407fe87ce1054d25d12bc69" ON "library_assets" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfb2eb766749ce24f672668877" ON "library_assets" ("ownerType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c60d1ffa43d3feec9d8e269e41" ON "library_assets" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83032aaeb403c33c05039709ab" ON "library_assets" ("sectorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4af8fe49622b4bc3ff74fae6e1" ON "library_assets" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c380e37fdf9af39bac77301752" ON "library_assets" ("subCategoryId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" ADD CONSTRAINT "FK_c60d1ffa43d3feec9d8e269e41b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" ADD CONSTRAINT "FK_83032aaeb403c33c05039709ab4" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" ADD CONSTRAINT "FK_4af8fe49622b4bc3ff74fae6e12" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" ADD CONSTRAINT "FK_c380e37fdf9af39bac773017526" FOREIGN KEY ("subCategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "library_assets" DROP CONSTRAINT "FK_c380e37fdf9af39bac773017526"`,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" DROP CONSTRAINT "FK_4af8fe49622b4bc3ff74fae6e12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" DROP CONSTRAINT "FK_83032aaeb403c33c05039709ab4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "library_assets" DROP CONSTRAINT "FK_c60d1ffa43d3feec9d8e269e41b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c380e37fdf9af39bac77301752"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4af8fe49622b4bc3ff74fae6e1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83032aaeb403c33c05039709ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c60d1ffa43d3feec9d8e269e41"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfb2eb766749ce24f672668877"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f0407fe87ce1054d25d12bc69"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_923e9e7e76a8363e55b0794025"`,
    );
    await queryRunner.query(`DROP TABLE "library_assets"`);
    await queryRunner.query(
      `DROP TYPE "public"."library_assets_ownertype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."library_assets_type_enum"`);
  }
}
