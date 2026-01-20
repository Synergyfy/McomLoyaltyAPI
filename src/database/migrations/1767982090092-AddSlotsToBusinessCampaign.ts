import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlotsToBusinessCampaign1767982090092
  implements MigrationInterface
{
  name = "AddSlotsToBusinessCampaign1767982090092";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "total_slots" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "remaining_slots" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "remaining_slots"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "total_slots"`,
    );
  }
}
