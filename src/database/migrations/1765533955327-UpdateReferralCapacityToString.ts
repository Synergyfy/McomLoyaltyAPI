import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReferralCapacityToString1765533955327
  implements MigrationInterface
{
  name = "UpdateReferralCapacityToString1765533955327";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "referralCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "referralCapacity" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "referralCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "referralCapacity" integer`,
    );
  }
}
