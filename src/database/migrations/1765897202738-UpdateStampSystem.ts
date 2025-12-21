import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStampSystem1765897202738 implements MigrationInterface {
  name = "UpdateStampSystem1765897202738";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stamp_reward_templates" ADD "is_archived" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stamp_reward_templates" DROP COLUMN "is_archived"`,
    );
  }
}
