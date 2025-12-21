import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemainingQuantityToBusinessReward1764796726073
  implements MigrationInterface
{
  name = "AddRemainingQuantityToBusinessReward1764796726073";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "remaining_quantity" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "remaining_quantity"`,
    );
  }
}
