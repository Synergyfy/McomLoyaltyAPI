import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRewardStampPlurals1766779846943
  implements MigrationInterface
{
  name = "UpdateRewardStampPlurals1766779846943";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(
    //   \`ALTER TABLE "reward" RENAME COLUMN "max_stamp_required" TO "max_stamps_required"\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" DROP COLUMN "point_required"\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" DROP COLUMN "stamp_required"\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" ADD "points_required" integer\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" ADD "stamps_required" integer\`,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" DROP COLUMN "stamps_required"\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" DROP COLUMN "points_required"\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" ADD "stamp_required" integer\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "business_reward" ADD "point_required" integer\`,
    // );
    // await queryRunner.query(
    //   \`ALTER TABLE "reward" RENAME COLUMN "max_stamps_required" TO "max_stamp_required"\`,
    // );
  }
}
