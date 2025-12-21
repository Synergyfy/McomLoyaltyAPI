import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentToGroupCircleContribution1766068714627
  implements MigrationInterface
{
  name = "AddPaymentToGroupCircleContribution1766068714627";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."network_lists_type_enum" AS ENUM('B2B', 'B2C')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."network_lists_geography_enum" AS ENUM('nearby', 'hyperlocal', 'national', 'global')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."network_lists_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "network_lists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "type" "public"."network_lists_type_enum" NOT NULL, "geography" "public"."network_lists_geography_enum" NOT NULL, "status" "public"."network_lists_status_enum" NOT NULL DEFAULT 'active', "businessId" uuid, CONSTRAINT "PK_0f45e15eb158610953f213c7b5a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circle_members_role_enum" AS ENUM('CORE', 'PERIPHERAL', 'BANKER', 'PARTNER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_circle_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "role" "public"."group_circle_members_role_enum" NOT NULL DEFAULT 'PERIPHERAL', "drawDate" TIMESTAMP, "groupCircleId" uuid, "networkId" uuid, CONSTRAINT "PK_e5e21af2f42d2da43fce823e91f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circles_type_enum" AS ENUM('MARKETING', 'ADVERTISING', 'NEARBY', 'HYPERLOCAL', 'NATIONAL', 'GLOBAL', 'SMART_MONEY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circles_visibility_enum" AS ENUM('PRIVATE', 'INVITE_ONLY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circles_interactionlevel_enum" AS ENUM('READ', 'MESSAGE', 'COLLABORATE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circles_status_enum" AS ENUM('active', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_circles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "description" character varying, "type" "public"."group_circles_type_enum" NOT NULL, "duration" integer NOT NULL, "visibility" "public"."group_circles_visibility_enum" NOT NULL, "interactionLevel" "public"."group_circles_interactionlevel_enum" NOT NULL, "status" "public"."group_circles_status_enum" NOT NULL DEFAULT 'active', "contributionAmount" numeric, "payoutFrequency" character varying, "currentRound" integer NOT NULL DEFAULT '0', "startDate" TIMESTAMP, "businessId" uuid, CONSTRAINT "PK_c3f5a975d389a2e4b1760cd09c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "content" character varying NOT NULL, "senderName" character varying NOT NULL, "senderId" character varying NOT NULL, "groupCircleId" uuid, CONSTRAINT "PK_f4b396868f303fa38023b61d742" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circle_contributions_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_circle_contributions_provider_enum" AS ENUM('STRIPE', 'PAYPAL', 'MANUAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_circle_contributions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "amount" numeric NOT NULL, "round" integer NOT NULL, "status" "public"."group_circle_contributions_status_enum" NOT NULL DEFAULT 'PENDING', "paidAt" TIMESTAMP, "provider" "public"."group_circle_contributions_provider_enum" NOT NULL DEFAULT 'MANUAL', "transactionId" character varying, "groupCircleId" uuid, "memberId" uuid, CONSTRAINT "PK_fefefb4c906d987caeef56f62fa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "action" character varying NOT NULL, "details" jsonb, "groupCircleId" uuid, CONSTRAINT "PK_95d0e7c0e65fe51b1f297a515af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "network_list_members" ("network_list_id" uuid NOT NULL, "network_id" uuid NOT NULL, CONSTRAINT "PK_db046e00f0acbbfe8260c200e28" PRIMARY KEY ("network_list_id", "network_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2294e4466c08de9100fa95122" ON "network_list_members" ("network_list_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec17e1db14171aca829e004bd3" ON "network_list_members" ("network_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "group_circle_source_lists" ("groupCirclesId" uuid NOT NULL, "networkListsId" uuid NOT NULL, CONSTRAINT "PK_8828ac7cae150fea08cc507c30f" PRIMARY KEY ("groupCirclesId", "networkListsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b883275e8b8b59af84e4b4ed1" ON "group_circle_source_lists" ("groupCirclesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46c2da603a582b3834001abc7d" ON "group_circle_source_lists" ("networkListsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "postalCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "network_lists" ADD CONSTRAINT "FK_15571716abaf760990861dea63b" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_members" ADD CONSTRAINT "FK_7f19d0c47285b5c17a98d0e3f32" FOREIGN KEY ("groupCircleId") REFERENCES "group_circles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_members" ADD CONSTRAINT "FK_a370303c48880895dff73df9348" FOREIGN KEY ("networkId") REFERENCES "networks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circles" ADD CONSTRAINT "FK_a99c24f0bc263ff0b26b2db91a4" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" ADD CONSTRAINT "FK_22f3d06840778e920c8bddae9b5" FOREIGN KEY ("groupCircleId") REFERENCES "group_circles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_contributions" ADD CONSTRAINT "FK_4e939ce9ee08fdd33deb6739651" FOREIGN KEY ("groupCircleId") REFERENCES "group_circles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_contributions" ADD CONSTRAINT "FK_73be752dc4282010488ff760f2a" FOREIGN KEY ("memberId") REFERENCES "group_circle_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activities" ADD CONSTRAINT "FK_902c6cb86d2f25da3a398c10a89" FOREIGN KEY ("groupCircleId") REFERENCES "group_circles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "network_list_members" ADD CONSTRAINT "FK_e2294e4466c08de9100fa951224" FOREIGN KEY ("network_list_id") REFERENCES "network_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "network_list_members" ADD CONSTRAINT "FK_ec17e1db14171aca829e004bd3b" FOREIGN KEY ("network_id") REFERENCES "networks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_source_lists" ADD CONSTRAINT "FK_4b883275e8b8b59af84e4b4ed16" FOREIGN KEY ("groupCirclesId") REFERENCES "group_circles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_source_lists" ADD CONSTRAINT "FK_46c2da603a582b3834001abc7dd" FOREIGN KEY ("networkListsId") REFERENCES "network_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_circle_source_lists" DROP CONSTRAINT "FK_46c2da603a582b3834001abc7dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_source_lists" DROP CONSTRAINT "FK_4b883275e8b8b59af84e4b4ed16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "network_list_members" DROP CONSTRAINT "FK_ec17e1db14171aca829e004bd3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "network_list_members" DROP CONSTRAINT "FK_e2294e4466c08de9100fa951224"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activities" DROP CONSTRAINT "FK_902c6cb86d2f25da3a398c10a89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_contributions" DROP CONSTRAINT "FK_73be752dc4282010488ff760f2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_contributions" DROP CONSTRAINT "FK_4e939ce9ee08fdd33deb6739651"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_messages" DROP CONSTRAINT "FK_22f3d06840778e920c8bddae9b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circles" DROP CONSTRAINT "FK_a99c24f0bc263ff0b26b2db91a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_members" DROP CONSTRAINT "FK_a370303c48880895dff73df9348"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_circle_members" DROP CONSTRAINT "FK_7f19d0c47285b5c17a98d0e3f32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "network_lists" DROP CONSTRAINT "FK_15571716abaf760990861dea63b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "postalCode" character varying NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46c2da603a582b3834001abc7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b883275e8b8b59af84e4b4ed1"`,
    );
    await queryRunner.query(`DROP TABLE "group_circle_source_lists"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec17e1db14171aca829e004bd3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2294e4466c08de9100fa95122"`,
    );
    await queryRunner.query(`DROP TABLE "network_list_members"`);
    await queryRunner.query(`DROP TABLE "group_activities"`);
    await queryRunner.query(`DROP TABLE "group_circle_contributions"`);
    await queryRunner.query(
      `DROP TYPE "public"."group_circle_contributions_provider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."group_circle_contributions_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "group_messages"`);
    await queryRunner.query(`DROP TABLE "group_circles"`);
    await queryRunner.query(`DROP TYPE "public"."group_circles_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."group_circles_interactionlevel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."group_circles_visibility_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."group_circles_type_enum"`);
    await queryRunner.query(`DROP TABLE "group_circle_members"`);
    await queryRunner.query(
      `DROP TYPE "public"."group_circle_members_role_enum"`,
    );
    await queryRunner.query(`DROP TABLE "network_lists"`);
    await queryRunner.query(`DROP TYPE "public"."network_lists_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."network_lists_geography_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."network_lists_type_enum"`);
  }
}
