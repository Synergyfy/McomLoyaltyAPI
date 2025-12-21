import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferralAndStreak1765315980468 implements MigrationInterface {
  name = "AddReferralAndStreak1765315980468";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_59de462f9ce130da142e3b5a9f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5"`,
    );
    await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "referrerId"`);
    await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "referredId"`);
    await queryRunner.query(
      `ALTER TABLE "point_histories" ADD "actionKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "phoneNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "isPhoneVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "participants" ADD "dob" date`);
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "profilePhoto" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "lastLoginDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "currentLoginStreak" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "dailyAppOpenCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" ADD "lastAppOpenDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD "refereeEmail" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD "pointsEarned" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD "code" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "referrals" ADD "referrer_id" uuid`);
    await queryRunner.query(`ALTER TABLE "referrals" ADD "referee_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "UQ_3703ae83894cb2e054d405b9273" UNIQUE ("referee_id")`,
    );
    await queryRunner.query(`ALTER TABLE "referrals" ADD "campaign_id" uuid`);
    await queryRunner.query(
      `ALTER TYPE "public"."referrals_status_enum" RENAME TO "referrals_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."referrals_status_enum" AS ENUM('PENDING', 'SUCCESSFUL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ALTER COLUMN "status" TYPE "public"."referrals_status_enum" USING "status"::"text"::"public"."referrals_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."referrals_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_18af9fcaffac6d6d3b28130e149" FOREIGN KEY ("referrer_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_3703ae83894cb2e054d405b9273" FOREIGN KEY ("referee_id") REFERENCES "participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_2605855a0411d3d8948e6b76346" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_2605855a0411d3d8948e6b76346"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_3703ae83894cb2e054d405b9273"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_18af9fcaffac6d6d3b28130e149"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."referrals_status_enum_old" AS ENUM('pending', 'completed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ALTER COLUMN "status" TYPE "public"."referrals_status_enum_old" USING "status"::"text"::"public"."referrals_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."referrals_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."referrals_status_enum_old" RENAME TO "referrals_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP COLUMN "campaign_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "UQ_3703ae83894cb2e054d405b9273"`,
    );
    await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "referee_id"`);
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP COLUMN "referrer_id"`,
    );
    await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "code"`);
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP COLUMN "pointsEarned"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP COLUMN "refereeEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "lastAppOpenDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "dailyAppOpenCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "currentLoginStreak"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "lastLoginDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "profilePhoto"`,
    );
    await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "dob"`);
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "isPhoneVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participants" DROP COLUMN "phoneNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_histories" DROP COLUMN "actionKey"`,
    );
    await queryRunner.query(`ALTER TABLE "referrals" ADD "referredId" uuid`);
    await queryRunner.query(`ALTER TABLE "referrals" ADD "referrerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_ad6772c3fcb57375f43114b5cb5" FOREIGN KEY ("referredId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_59de462f9ce130da142e3b5a9f4" FOREIGN KEY ("referrerId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
