import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostalCodeToBusiness1766079576567
  implements MigrationInterface
{
  name = "AddPostalCodeToBusiness1766079576567";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "postalCode" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "postalCode"`,
    );
  }
}
