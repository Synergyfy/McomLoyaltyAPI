import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampaignAndBusinessIndices1765639234504
  implements MigrationInterface
{
  name = "AddCampaignAndBusinessIndices1765639234504";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_73556eda143a5e520fa22a5b92" ON "business_campaigns" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_627775010550aa1a217aa31514" ON "businesses" ("sectorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d7c89efebdcbe7f54e92f5eed" ON "businesses" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4649a63b4c7b4b67f5850f0153" ON "businesses" ("subCategoryId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4649a63b4c7b4b67f5850f0153"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d7c89efebdcbe7f54e92f5eed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_627775010550aa1a217aa31514"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73556eda143a5e520fa22a5b92"`,
    );
  }
}
