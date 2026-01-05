import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchema1767523651888 implements MigrationInterface {
  name = "UpdateSchema1767523651888";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" DROP COLUMN "quantity"`,
    );
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "quantity"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD "quantity" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns" ADD "quantity" integer NOT NULL`,
    );
  }
}
