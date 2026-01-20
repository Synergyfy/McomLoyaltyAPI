import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrainingSupportEntities1767805929404
  implements MigrationInterface
{
  name = "AddTrainingSupportEntities1767805929404";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."training_videos_target_audience_enum" AS ENUM('participant', 'business', 'all')`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "target_audience" "public"."training_videos_target_audience_enum" NOT NULL, "description" text NOT NULL, "video_url" character varying NOT NULL, CONSTRAINT "PK_567d0937a5abeabe7f75bdc95c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."help_center_articles_target_audience_enum" AS ENUM('participant', 'business', 'all')`,
    );
    await queryRunner.query(
      `CREATE TABLE "help_center_articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "category" character varying NOT NULL, "content" text NOT NULL, "short_description" text NOT NULL, "target_audience" "public"."help_center_articles_target_audience_enum" NOT NULL, CONSTRAINT "PK_3b5be63ef1ab448b4c91d0e3b21" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_guides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "description" text NOT NULL, "target_tier_id" uuid, CONSTRAINT "PK_7c5190d686bc48d8aeef6fd7e67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "training_video_tiers" ("trainingVideosId" uuid NOT NULL, "tierId" uuid NOT NULL, CONSTRAINT "PK_66e847b6c7586eda7ab9d0ecb14" PRIMARY KEY ("trainingVideosId", "tierId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2818b939be4c0cbdc68699293" ON "training_video_tiers" ("trainingVideosId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7311395b61fad676b2f15c266e" ON "training_video_tiers" ("tierId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "help_center_article_tiers" ("helpCenterArticlesId" uuid NOT NULL, "tierId" uuid NOT NULL, CONSTRAINT "PK_900a925267c0c988486a30b31da" PRIMARY KEY ("helpCenterArticlesId", "tierId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_104cca777a2897ece0c71eb16d" ON "help_center_article_tiers" ("helpCenterArticlesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc865081ea1098ed703dc5433d" ON "help_center_article_tiers" ("tierId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "training_guide_videos" ("trainingGuidesId" uuid NOT NULL, "trainingVideosId" uuid NOT NULL, CONSTRAINT "PK_524a8125e78d83c08d0545730eb" PRIMARY KEY ("trainingGuidesId", "trainingVideosId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_670c54bb3c4101b7cdcaa0bf72" ON "training_guide_videos" ("trainingGuidesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a29e9935aa49e5b3d810727c0c" ON "training_guide_videos" ("trainingVideosId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "training_guide_articles" ("trainingGuidesId" uuid NOT NULL, "helpCenterArticlesId" uuid NOT NULL, CONSTRAINT "PK_ab3f0ae40336620b8a404b60ffb" PRIMARY KEY ("trainingGuidesId", "helpCenterArticlesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f58e038d62cfd336953ad3c398" ON "training_guide_articles" ("trainingGuidesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d84bf82998eef49f3c35091312" ON "training_guide_articles" ("helpCenterArticlesId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guides" ADD CONSTRAINT "FK_2208bac58d0f02c5925f2cd1f69" FOREIGN KEY ("target_tier_id") REFERENCES "tier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_video_tiers" ADD CONSTRAINT "FK_a2818b939be4c0cbdc686992934" FOREIGN KEY ("trainingVideosId") REFERENCES "training_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_video_tiers" ADD CONSTRAINT "FK_7311395b61fad676b2f15c266ee" FOREIGN KEY ("tierId") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "help_center_article_tiers" ADD CONSTRAINT "FK_104cca777a2897ece0c71eb16dc" FOREIGN KEY ("helpCenterArticlesId") REFERENCES "help_center_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "help_center_article_tiers" ADD CONSTRAINT "FK_bc865081ea1098ed703dc5433d7" FOREIGN KEY ("tierId") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_videos" ADD CONSTRAINT "FK_670c54bb3c4101b7cdcaa0bf727" FOREIGN KEY ("trainingGuidesId") REFERENCES "training_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_videos" ADD CONSTRAINT "FK_a29e9935aa49e5b3d810727c0c7" FOREIGN KEY ("trainingVideosId") REFERENCES "training_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_articles" ADD CONSTRAINT "FK_f58e038d62cfd336953ad3c3980" FOREIGN KEY ("trainingGuidesId") REFERENCES "training_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_articles" ADD CONSTRAINT "FK_d84bf82998eef49f3c350913128" FOREIGN KEY ("helpCenterArticlesId") REFERENCES "help_center_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "training_guide_articles" DROP CONSTRAINT "FK_d84bf82998eef49f3c350913128"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_articles" DROP CONSTRAINT "FK_f58e038d62cfd336953ad3c3980"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_videos" DROP CONSTRAINT "FK_a29e9935aa49e5b3d810727c0c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guide_videos" DROP CONSTRAINT "FK_670c54bb3c4101b7cdcaa0bf727"`,
    );
    await queryRunner.query(
      `ALTER TABLE "help_center_article_tiers" DROP CONSTRAINT "FK_bc865081ea1098ed703dc5433d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "help_center_article_tiers" DROP CONSTRAINT "FK_104cca777a2897ece0c71eb16dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_video_tiers" DROP CONSTRAINT "FK_7311395b61fad676b2f15c266ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_video_tiers" DROP CONSTRAINT "FK_a2818b939be4c0cbdc686992934"`,
    );
    await queryRunner.query(
      `ALTER TABLE "training_guides" DROP CONSTRAINT "FK_2208bac58d0f02c5925f2cd1f69"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d84bf82998eef49f3c35091312"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f58e038d62cfd336953ad3c398"`,
    );
    await queryRunner.query(`DROP TABLE "training_guide_articles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a29e9935aa49e5b3d810727c0c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_670c54bb3c4101b7cdcaa0bf72"`,
    );
    await queryRunner.query(`DROP TABLE "training_guide_videos"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bc865081ea1098ed703dc5433d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_104cca777a2897ece0c71eb16d"`,
    );
    await queryRunner.query(`DROP TABLE "help_center_article_tiers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7311395b61fad676b2f15c266e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2818b939be4c0cbdc68699293"`,
    );
    await queryRunner.query(`DROP TABLE "training_video_tiers"`);
    await queryRunner.query(`DROP TABLE "training_guides"`);
    await queryRunner.query(`DROP TABLE "help_center_articles"`);
    await queryRunner.query(
      `DROP TYPE "public"."help_center_articles_target_audience_enum"`,
    );
    await queryRunner.query(`DROP TABLE "training_videos"`);
    await queryRunner.query(
      `DROP TYPE "public"."training_videos_target_audience_enum"`,
    );
  }
}
