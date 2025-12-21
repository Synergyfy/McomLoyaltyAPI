import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorQrPlaque1765972274549 implements MigrationInterface {
  name = "RefactorQrPlaque1765972274549";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_matching_point_history_business_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_matching_point_history_business_activity_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_matching_point_history_description"`,
    );
    await queryRunner.query(`ALTER TABLE "qr_plaques" DROP COLUMN "link"`);
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "pendingInviteEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "pendingInviteCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "uniqueCode" character varying(9) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD CONSTRAINT "UQ_e6d35b2a6862f74b6e35ad14c05" UNIQUE ("uniqueCode")`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "description" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "action_text" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "footer_text" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "content_url" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "qr_code_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "price" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "assignment_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "network_contact_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."qr_plaques_status_enum" RENAME TO "qr_plaques_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."qr_plaques_status_enum" AS ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'ASSIGNED', 'FOR_SALE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ALTER COLUMN "status" TYPE "public"."qr_plaques_status_enum" USING "status"::"text"::"public"."qr_plaques_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."qr_plaques_status_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_28d74c535ab494aef036a5af4f" ON "qr_plaques" ("name", "description") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd165b7f31bb7947b7ca678374" ON "matching_point_history" ("description") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_607294233404aee15015863108" ON "matching_point_history" ("businessId", "activity_type", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34313a30c313e2e16e30c7f5b1" ON "matching_point_history" ("businessId", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD CONSTRAINT "FK_2c99cd41afc88ebf7970de0a8da" FOREIGN KEY ("network_contact_id") REFERENCES "networks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP CONSTRAINT "FK_2c99cd41afc88ebf7970de0a8da"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_34313a30c313e2e16e30c7f5b1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_607294233404aee15015863108"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd165b7f31bb7947b7ca678374"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28d74c535ab494aef036a5af4f"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."qr_plaques_status_enum_old" AS ENUM('ACTIVE', 'INACTIVE', 'FOR_SALE', 'PENDING_ASSIGNMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ALTER COLUMN "status" TYPE "public"."qr_plaques_status_enum_old" USING "status"::"text"::"public"."qr_plaques_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ALTER COLUMN "status" SET DEFAULT 'PENDING_ASSIGNMENT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."qr_plaques_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."qr_plaques_status_enum_old" RENAME TO "qr_plaques_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "network_contact_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "assignment_code"`,
    );
    await queryRunner.query(`ALTER TABLE "qr_plaques" DROP COLUMN "price"`);
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "qr_code_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "content_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "footer_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "action_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "description"`,
    );
    await queryRunner.query(`ALTER TABLE "qr_plaques" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP CONSTRAINT "UQ_e6d35b2a6862f74b6e35ad14c05"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" DROP COLUMN "uniqueCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "pendingInviteCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "pendingInviteEmail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_plaques" ADD "link" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matching_point_history_description" ON "matching_point_history" ("description") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matching_point_history_business_activity_created_at" ON "matching_point_history" ("activity_type", "businessId", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_matching_point_history_business_created_at" ON "matching_point_history" ("businessId", "created_at") `,
    );
  }
}
