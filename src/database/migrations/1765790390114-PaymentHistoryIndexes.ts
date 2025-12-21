import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentHistoryIndexes1765790390114 implements MigrationInterface {
  name = "PaymentHistoryIndexes1765790390114";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_5496d67c34ebd831651d2dfd63" ON "payment_history" ("user_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c025389b7a2906d167765c115d" ON "payment_history" ("payment_provider") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f30e0f7b3175a705eca123073b" ON "payment_history" ("transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_484bf075f2c432da575b7ba9ae" ON "payment_history" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a18107ab756cf34138126ba5f" ON "payment_history" ("purchaseType") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a18107ab756cf34138126ba5f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_484bf075f2c432da575b7ba9ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f30e0f7b3175a705eca123073b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c025389b7a2906d167765c115d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5496d67c34ebd831651d2dfd63"`,
    );
  }
}
