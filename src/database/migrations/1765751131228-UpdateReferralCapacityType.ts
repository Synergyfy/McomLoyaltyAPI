import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReferralCapacityType1765751131228
  implements MigrationInterface
{
  name = "UpdateReferralCapacityType1765751131228";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "referralCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "referralCapacity" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "referralCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "referralCapacity" character varying`,
    );
  }
}
