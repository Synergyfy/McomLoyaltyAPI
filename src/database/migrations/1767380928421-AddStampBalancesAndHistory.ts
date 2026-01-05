import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStampBalancesAndHistory1767380928421
  implements MigrationInterface
{
  name = "AddStampBalancesAndHistory1767380928421";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" ADD "stamp_balance" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD "stamps" integer`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum" RENAME TO "point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum" AS ENUM('EARN', 'REDEEM', 'MATCHING', 'PURCHASED_EXTRA', 'STAMP_EARN', 'STAMP_REDEEM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum" USING "type"::"text"::"public"."point_histories_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "points" SET DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "points" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_histories_type_enum_old" AS ENUM('EARN', 'MATCHING', 'PURCHASED_EXTRA', 'REDEEM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" ALTER COLUMN "type" TYPE "public"."point_histories_type_enum_old" USING "type"::"text"::"public"."point_histories_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."point_histories_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."point_histories_type_enum_old" RENAME TO "point_histories_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP COLUMN "stamps"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_campaign_balances" DROP COLUMN "stamp_balance"`,
    );
  }
}
