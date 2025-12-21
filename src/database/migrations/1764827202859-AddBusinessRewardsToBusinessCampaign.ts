import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessRewardsToBusinessCampaign1764827202859
  implements MigrationInterface
{
  name = "AddBusinessRewardsToBusinessCampaign1764827202859";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "business_campaigns_business_rewards_business_reward" ("businessCampaignsId" uuid NOT NULL, "businessRewardId" uuid NOT NULL, CONSTRAINT "PK_af6569323b10bfbad12075e3de5" PRIMARY KEY ("businessCampaignsId", "businessRewardId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55ab26f094f421f81afc86ccc6" ON "business_campaigns_business_rewards_business_reward" ("businessCampaignsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_743af360fc9f053496b8feb527" ON "business_campaigns_business_rewards_business_reward" ("businessRewardId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_business_rewards_business_reward" ADD CONSTRAINT "FK_55ab26f094f421f81afc86ccc62" FOREIGN KEY ("businessCampaignsId") REFERENCES "business_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_business_rewards_business_reward" ADD CONSTRAINT "FK_743af360fc9f053496b8feb5273" FOREIGN KEY ("businessRewardId") REFERENCES "business_reward"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_business_rewards_business_reward" DROP CONSTRAINT "FK_743af360fc9f053496b8feb5273"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_campaigns_business_rewards_business_reward" DROP CONSTRAINT "FK_55ab26f094f421f81afc86ccc62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_743af360fc9f053496b8feb527"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55ab26f094f421f81afc86ccc6"`,
    );
    await queryRunner.query(
      `DROP TABLE "business_campaigns_business_rewards_business_reward"`,
    );
  }
}
