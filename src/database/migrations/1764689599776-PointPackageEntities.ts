import { MigrationInterface, QueryRunner } from "typeorm";

export class PointPackageEntities1764689599776 implements MigrationInterface {
  name = "PointPackageEntities1764689599776";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "point_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "points" integer NOT NULL, "price" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'GBP', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_125dd24af137397d6b7fcec7f0a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_point_packages_status_enum" AS ENUM('ACTIVE', 'DEPLETED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_point_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "initial_points" integer NOT NULL, "remaining_points" integer NOT NULL, "purchase_date" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."business_point_packages_status_enum" NOT NULL DEFAULT 'ACTIVE', "transaction_id" character varying, "businessId" uuid, "packageId" uuid, CONSTRAINT "PK_61f15b6fc51c3042d9701175d62" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "point_package_tiers" ("point_package_id" uuid NOT NULL, "tier_id" uuid NOT NULL, CONSTRAINT "PK_edc9b3f2da85291c597d7677b76" PRIMARY KEY ("point_package_id", "tier_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f378f3bf04d10d0264dfee6155" ON "point_package_tiers" ("point_package_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_208e51b833fe8b076c19e9ea34" ON "point_package_tiers" ("tier_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "business_point_packages" ADD CONSTRAINT "FK_e3284c26e3b89a0f50bf1d7be33" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_point_packages" ADD CONSTRAINT "FK_fa1ad91bc9e51bc508b1f65b4c4" FOREIGN KEY ("packageId") REFERENCES "point_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_package_tiers" ADD CONSTRAINT "FK_f378f3bf04d10d0264dfee61552" FOREIGN KEY ("point_package_id") REFERENCES "point_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_package_tiers" ADD CONSTRAINT "FK_208e51b833fe8b076c19e9ea348" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "point_package_tiers" DROP CONSTRAINT "FK_208e51b833fe8b076c19e9ea348"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_package_tiers" DROP CONSTRAINT "FK_f378f3bf04d10d0264dfee61552"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_point_packages" DROP CONSTRAINT "FK_fa1ad91bc9e51bc508b1f65b4c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_point_packages" DROP CONSTRAINT "FK_e3284c26e3b89a0f50bf1d7be33"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_208e51b833fe8b076c19e9ea34"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f378f3bf04d10d0264dfee6155"`,
    );
    await queryRunner.query(`DROP TABLE "point_package_tiers"`);
    await queryRunner.query(`DROP TABLE "business_point_packages"`);
    await queryRunner.query(
      `DROP TYPE "public"."business_point_packages_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "point_packages"`);
  }
}
