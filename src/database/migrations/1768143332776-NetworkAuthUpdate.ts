import { MigrationInterface, QueryRunner } from "typeorm";

export class NetworkAuthUpdate1768143332776 implements MigrationInterface {
  name = "NetworkAuthUpdate1768143332776";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_analytics" DROP CONSTRAINT "FK_deal_analytics_deal_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "password" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."staff_role_enum" RENAME TO "staff_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."staff_role_enum" AS ENUM('Admin', 'Business', 'Staff', 'Participant', 'Partner', 'Network')`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ALTER COLUMN "role" TYPE "public"."staff_role_enum" USING "role"::"text"::"public"."staff_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ALTER COLUMN "role" SET DEFAULT 'Staff'`,
    );
    await queryRunner.query(`DROP TYPE "public"."staff_role_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."participants_role_enum" RENAME TO "participants_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."participants_role_enum" AS ENUM('Admin', 'Business', 'Staff', 'Participant', 'Partner', 'Network')`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ALTER COLUMN "role" TYPE "public"."participants_role_enum" USING "role"::"text"::"public"."participants_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ALTER COLUMN "role" SET DEFAULT 'Participant'`,
    );
    await queryRunner.query(`DROP TYPE "public"."participants_role_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."businesses_role_enum" RENAME TO "businesses_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."businesses_role_enum" AS ENUM('Admin', 'Business', 'Staff', 'Participant', 'Partner', 'Network')`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "role" TYPE "public"."businesses_role_enum" USING "role"::"text"::"public"."businesses_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "role" SET DEFAULT 'Business'`,
    );
    await queryRunner.query(`DROP TYPE "public"."businesses_role_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."admins_role_enum" RENAME TO "admins_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admins_role_enum" AS ENUM('Admin', 'Business', 'Staff', 'Participant', 'Partner', 'Network')`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "role" TYPE "public"."admins_role_enum" USING "role"::"text"::"public"."admins_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'Admin'`,
    );
    await queryRunner.query(`DROP TYPE "public"."admins_role_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "deal_analytics" ADD CONSTRAINT "FK_4a78e3e9252ac610441e34e39da" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deal_analytics" DROP CONSTRAINT "FK_4a78e3e9252ac610441e34e39da"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admins_role_enum_old" AS ENUM('Admin', 'Business', 'Participant', 'Partner', 'Staff')`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "role" TYPE "public"."admins_role_enum_old" USING "role"::"text"::"public"."admins_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'Admin'`,
    );
    await queryRunner.query(`DROP TYPE "public"."admins_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."admins_role_enum_old" RENAME TO "admins_role_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."businesses_role_enum_old" AS ENUM('Admin', 'Business', 'Participant', 'Partner', 'Staff')`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "role" TYPE "public"."businesses_role_enum_old" USING "role"::"text"::"public"."businesses_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ALTER COLUMN "role" SET DEFAULT 'Business'`,
    );
    await queryRunner.query(`DROP TYPE "public"."businesses_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."businesses_role_enum_old" RENAME TO "businesses_role_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."participants_role_enum_old" AS ENUM('Admin', 'Business', 'Participant', 'Partner', 'Staff')`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ALTER COLUMN "role" TYPE "public"."participants_role_enum_old" USING "role"::"text"::"public"."participants_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ALTER COLUMN "role" SET DEFAULT 'Participant'`,
    );
    await queryRunner.query(`DROP TYPE "public"."participants_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."participants_role_enum_old" RENAME TO "participants_role_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."staff_role_enum_old" AS ENUM('Admin', 'Business', 'Participant', 'Partner', 'Staff')`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ALTER COLUMN "role" TYPE "public"."staff_role_enum_old" USING "role"::"text"::"public"."staff_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ALTER COLUMN "role" SET DEFAULT 'Staff'`,
    );
    await queryRunner.query(`DROP TYPE "public"."staff_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."staff_role_enum_old" RENAME TO "staff_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "partners" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "networks" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(`ALTER TABLE "networks" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "deal_analytics" ADD CONSTRAINT "FK_deal_analytics_deal_id" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
