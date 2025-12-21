import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorGroupCircleNetworkIds1766150416631
  implements MigrationInterface
{
  name = "RefactorGroupCircleNetworkIds1766150416631";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "isOnboarded" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."networks_onboardedtype_enum" AS ENUM('partner', 'business')`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "onboardedType" "public"."networks_onboardedtype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "onboardedBusinessId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "onboardedPartnerId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "partners" ADD "sector_id" uuid`);
    await queryRunner.query(`ALTER TABLE "partners" ADD "category_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "partners" ADD CONSTRAINT "FK_a1064437b5698bbb3377b31b1d1" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" ADD CONSTRAINT "FK_006a6abd79a0b9ee3214329d56e" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "partners" DROP CONSTRAINT "FK_006a6abd79a0b9ee3214329d56e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" DROP CONSTRAINT "FK_a1064437b5698bbb3377b31b1d1"`,
    );
    await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "category_id"`);
    await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "sector_id"`);
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "onboardedPartnerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "onboardedBusinessId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "onboardedType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."networks_onboardedtype_enum"`);
    await queryRunner.query(`ALTER TABLE "networks" DROP COLUMN "isOnboarded"`);
  }
}
