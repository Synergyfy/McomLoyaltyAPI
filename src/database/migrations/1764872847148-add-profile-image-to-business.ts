import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileImageToBusiness1764872847148
  implements MigrationInterface
{
  name = "AddProfileImageToBusiness1764872847148";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "profile_image" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "profile_image"`,
    );
  }
}
