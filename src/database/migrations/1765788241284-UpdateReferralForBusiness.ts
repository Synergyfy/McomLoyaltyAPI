import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReferralForBusiness1765788241284
  implements MigrationInterface
{
  name = "UpdateReferralForBusiness1765788241284";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD "referrer_business_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD "referee_business_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "UQ_bc396bea5218db1c5f2f1de0b73" UNIQUE ("referee_business_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_676d48726b83e0754d31450478f" FOREIGN KEY ("referrer_business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_bc396bea5218db1c5f2f1de0b73" FOREIGN KEY ("referee_business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_bc396bea5218db1c5f2f1de0b73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_676d48726b83e0754d31450478f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "UQ_bc396bea5218db1c5f2f1de0b73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP COLUMN "referee_business_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP COLUMN "referrer_business_id"`,
    );
  }
}
