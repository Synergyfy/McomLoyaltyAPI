import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorBusinessTags1766991467230 implements MigrationInterface {
  name = "RefactorBusinessTags1766991467230";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "networks" DROP COLUMN "locationTag"`);
    await queryRunner.query(`DROP TYPE "public"."networks_locationtag_enum"`);
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "relationshipTag"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."networks_relationshiptag_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."businesses_locationtag_enum" AS ENUM('nearby', 'hyperlocal', 'national')`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "locationTag" "public"."businesses_locationtag_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."businesses_relationshiptag_enum" AS ENUM('partner', 'customer', 'supplier', 'affiliate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "relationshipTag" "public"."businesses_relationshiptag_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "relationshipTag"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."businesses_relationshiptag_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "locationTag"`,
    );
    await queryRunner.query(`DROP TYPE "public"."businesses_locationtag_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."networks_relationshiptag_enum" AS ENUM('partner', 'customer', 'supplier', 'affiliate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "relationshipTag" "public"."networks_relationshiptag_enum" NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."networks_locationtag_enum" AS ENUM('nearby', 'hyperlocal', 'national')`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "locationTag" "public"."networks_locationtag_enum" NOT NULL`,
    );
  }
}
