import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveValueFromBusinessReward1764760573529
  implements MigrationInterface
{
  name = "RemoveValueFromBusinessReward1764760573529";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "value"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "value" integer`,
    );
  }
}
