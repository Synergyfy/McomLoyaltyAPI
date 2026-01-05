import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsToNetwork1767012627795 implements MigrationInterface {
  name = "AddTagsToNetwork1767012627795";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."networks_locationtag_enum" AS ENUM('nearby', 'hyperlocal', 'national')`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "locationTag" "public"."networks_locationtag_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."networks_relationshiptag_enum" AS ENUM('partner', 'customer', 'supplier', 'affiliate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "relationshipTag" "public"."networks_relationshiptag_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "relationshipTag"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."networks_relationshiptag_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "networks" DROP COLUMN "locationTag"`);
    await queryRunner.query(`DROP TYPE "public"."networks_locationtag_enum"`);
  }
}
