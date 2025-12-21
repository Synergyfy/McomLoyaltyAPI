import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPaymentHistoryUser1764196637770
  implements MigrationInterface
{
  name = "RefactorPaymentHistoryUser1764196637770";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "payment_history" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "payment_history" ADD CONSTRAINT "FK_87a6f5afc86958a2206e337065f" FOREIGN KEY ("user_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP CONSTRAINT "FK_87a6f5afc86958a2206e337065f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_history" ADD "user_id" character varying NOT NULL`,
    );
  }
}
