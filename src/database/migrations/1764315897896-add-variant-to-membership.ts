import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVariantToMembership1764315897896 implements MigrationInterface {
  name = "AddVariantToMembership1764315897896";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."membership_variant_enum" AS ENUM('standard', 'pro', 'pro_plus')`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD "variant" "public"."membership_variant_enum" NOT NULL DEFAULT 'standard'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "membership" DROP COLUMN "variant"`);
    await queryRunner.query(`DROP TYPE "public"."membership_variant_enum"`);
  }
}
