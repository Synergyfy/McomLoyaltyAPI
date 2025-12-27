import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchemaForRewardsAndWallet1766622848226
  implements MigrationInterface
{
  name = "UpdateSchemaForRewardsAndWallet1766622848226";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_transaction_type_enum" AS ENUM('TIER_ALLOCATION', 'TOPUP', 'SPEND_TIER', 'SPEND_TOPUP', 'REFUND')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallet_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."wallet_transaction_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "reference" character varying, "walletId" uuid, CONSTRAINT "PK_62a01b9c3a734b96a08c621b371" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_wallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tier_balance" numeric(10,2) NOT NULL DEFAULT '0', "topup_balance" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'GBP', "businessId" uuid, CONSTRAINT "REL_595e1281444780368a7938892d" UNIQUE ("businessId"), CONSTRAINT "PK_f195abda413f5f5f394e83d53ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "is_mall_integrated" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "mall_reward_value" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transaction" ADD CONSTRAINT "FK_07de5136ba8e92bb97d45b9a7af" FOREIGN KEY ("walletId") REFERENCES "business_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_wallet" ADD CONSTRAINT "FK_595e1281444780368a7938892d0" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_wallet" DROP CONSTRAINT "FK_595e1281444780368a7938892d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_07de5136ba8e92bb97d45b9a7af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "mall_reward_value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "is_mall_integrated"`,
    );
    await queryRunner.query(`DROP TABLE "business_wallet"`);
    await queryRunner.query(`DROP TABLE "wallet_transaction"`);
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transaction_type_enum"`,
    );
  }
}
