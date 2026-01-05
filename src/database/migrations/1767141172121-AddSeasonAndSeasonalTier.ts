import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeasonAndSeasonalTier1767141172121
  implements MigrationInterface
{
  name = "AddSeasonAndSeasonalTier1767141172121";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "season" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "description" text, "textColor" character varying, "bgColor" character varying, "borderColor" character varying, CONSTRAINT "PK_8ac0d081dbdb7ab02d166bcda9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "tier" ADD "season_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tier" ADD CONSTRAINT "FK_ae3dcab62f2f3147147a1bf85d8" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tier" DROP CONSTRAINT "FK_ae3dcab62f2f3147147a1bf85d8"`,
    );
    await queryRunner.query(`ALTER TABLE "tier" DROP COLUMN "season_id"`);
    await queryRunner.query(`DROP TABLE "season"`);
  }
}
