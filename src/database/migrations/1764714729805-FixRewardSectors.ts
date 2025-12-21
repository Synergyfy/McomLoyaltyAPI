import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRewardSectors1764714729805 implements MigrationInterface {
  name = "FixRewardSectors1764714729805";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reward_sectors_sector" ("rewardId" uuid NOT NULL, "sectorId" uuid NOT NULL, CONSTRAINT "PK_e6849dd5637712acdee50c6c6e4" PRIMARY KEY ("rewardId", "sectorId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b366b9db1b8ed147296b46b68" ON "reward_sectors_sector" ("rewardId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99725479bed402fca8a59dc8f3" ON "reward_sectors_sector" ("sectorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_sectors_sector" ADD CONSTRAINT "FK_5b366b9db1b8ed147296b46b689" FOREIGN KEY ("rewardId") REFERENCES "reward"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_sectors_sector" ADD CONSTRAINT "FK_99725479bed402fca8a59dc8f3d" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reward_sectors_sector" DROP CONSTRAINT "FK_99725479bed402fca8a59dc8f3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_sectors_sector" DROP CONSTRAINT "FK_5b366b9db1b8ed147296b46b689"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99725479bed402fca8a59dc8f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b366b9db1b8ed147296b46b68"`,
    );
    await queryRunner.query(`DROP TABLE "reward_sectors_sector"`);
  }
}
