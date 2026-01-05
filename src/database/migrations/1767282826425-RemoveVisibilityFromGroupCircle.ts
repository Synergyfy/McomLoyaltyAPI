import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveVisibilityFromGroupCircle1767282826425
  implements MigrationInterface
{
  name = "RemoveVisibilityFromGroupCircle1767282826425";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_circles" DROP COLUMN "visibility"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."group_circles_visibility_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."group_circles_visibility_enum" AS ENUM('INVITE_ONLY', 'PRIVATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circles" ADD "visibility" "public"."group_circles_visibility_enum" NOT NULL`,
    );
  }
}
