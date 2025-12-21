import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorTierAndProgression1764427349159
  implements MigrationInterface
{
  name = "RefactorTierAndProgression1764427349159";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."membership_progression_level_enum" AS ENUM('basic', 'pro', 'pro_plus')`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD "progression_level" "public"."membership_progression_level_enum" NOT NULL DEFAULT 'basic'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."membership_variant_enum" RENAME TO "membership_variant_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."membership_variant_enum" AS ENUM('standard', 'winter', 'summer', 'autumn', 'spring')`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ALTER COLUMN "variant" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ALTER COLUMN "variant" TYPE "public"."membership_variant_enum" USING "variant"::"text"::"public"."membership_variant_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ALTER COLUMN "variant" SET DEFAULT 'standard'`,
    );
    await queryRunner.query(`DROP TYPE "public"."membership_variant_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."membership_variant_enum_old" AS ENUM('standard', 'pro', 'pro_plus')`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ALTER COLUMN "variant" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ALTER COLUMN "variant" TYPE "public"."membership_variant_enum_old" USING "variant"::"text"::"public"."membership_variant_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ALTER COLUMN "variant" SET DEFAULT 'standard'`,
    );
    await queryRunner.query(`DROP TYPE "public"."membership_variant_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."membership_variant_enum_old" RENAME TO "membership_variant_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" DROP COLUMN "progression_level"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."membership_progression_level_enum"`,
    );
  }
}
