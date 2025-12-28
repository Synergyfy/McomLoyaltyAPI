import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMallRewardTypeToBusinessReward1766622848227
  implements MigrationInterface
{
  name = "AddMallRewardTypeToBusinessReward1766622848227";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."business_reward_mall_reward_type_enum" AS ENUM('VOUCHER', 'GIFT_CARD', 'COUPON')`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_reward" ADD "mall_reward_type" "public"."business_reward_mall_reward_type_enum" DEFAULT 'VOUCHER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_reward" DROP COLUMN "mall_reward_type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."business_reward_mall_reward_type_enum"`,
    );
  }
}
