import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessToMembership1764539349775
  implements MigrationInterface
{
  name = "AddBusinessToMembership1764539349775";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "membership" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "membership" DROP COLUMN "user_type"`);
    await queryRunner.query(`ALTER TABLE "membership" ADD "business_id" uuid`);
    await queryRunner.query(
      `ALTER TYPE "public"."reward_reward_source_enum" RENAME TO "reward_reward_source_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reward_reward_source_enum" AS ENUM('mcom vault', 'partner', 'business')`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ALTER COLUMN "reward_source" TYPE "public"."reward_reward_source_enum" USING "reward_source"::"text"::"public"."reward_reward_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."reward_reward_source_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."business_reward_reward_source_enum" RENAME TO "business_reward_reward_source_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_reward_reward_source_enum" AS ENUM('mcom vault', 'partner', 'business')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "reward_source" TYPE "public"."business_reward_reward_source_enum" USING "reward_source"::"text"::"public"."business_reward_reward_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_reward_reward_source_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD CONSTRAINT "FK_e1f16b505b8a3be1698997402db" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership" DROP CONSTRAINT "FK_e1f16b505b8a3be1698997402db"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_reward_reward_source_enum_old" AS ENUM('mcom vault', 'partner')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ALTER COLUMN "reward_source" TYPE "public"."business_reward_reward_source_enum_old" USING "reward_source"::"text"::"public"."business_reward_reward_source_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_reward_reward_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."business_reward_reward_source_enum_old" RENAME TO "business_reward_reward_source_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reward_reward_source_enum_old" AS ENUM('mcom vault', 'partner')`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward" ALTER COLUMN "reward_source" TYPE "public"."reward_reward_source_enum_old" USING "reward_source"::"text"::"public"."reward_reward_source_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."reward_reward_source_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."reward_reward_source_enum_old" RENAME TO "reward_reward_source_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" DROP COLUMN "business_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD "user_type" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership" ADD "user_id" character varying NOT NULL`,
    );
  }
}
