import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTargetTierToCampaign1764393074240
  implements MigrationInterface
{
  name = "AddTargetTierToCampaign1764393074240";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "target_tier_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD CONSTRAINT "FK_8341d5be1333c963dc4cbc50f6d" FOREIGN KEY ("target_tier_id") REFERENCES "tier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT "FK_8341d5be1333c963dc4cbc50f6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "target_tier_id"`,
    );
  }
}
