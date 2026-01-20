import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoverImageToTrainingVideo1767982090093
  implements MigrationInterface
{
  name = "AddCoverImageToTrainingVideo1767982090093";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_videos" ADD "cover_image" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_videos" DROP COLUMN "cover_image"`,
    );
  }
}
