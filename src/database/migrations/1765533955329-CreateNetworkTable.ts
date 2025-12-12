import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNetworkTable1765533955329 implements MigrationInterface {
    name = 'CreateNetworkTable1765533955329'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."networks_locationtag_enum" AS ENUM('nearby', 'hyperlocal', 'national')`);
        await queryRunner.query(`CREATE TYPE "public"."networks_relationshiptag_enum" AS ENUM('partner', 'customer', 'supplier', 'affiliate')`);
        await queryRunner.query(`CREATE TYPE "public"."networks_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "networks" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
            "fullName" character varying NOT NULL, 
            "businessName" character varying, 
            "email" character varying, 
            "phone" character varying NOT NULL, 
            "locationTag" "public"."networks_locationtag_enum" NOT NULL, 
            "relationshipTag" "public"."networks_relationshiptag_enum" NOT NULL, 
            "status" "public"."networks_status_enum" NOT NULL DEFAULT 'pending', 
            "permission" character varying NOT NULL DEFAULT 'pending', 
            "businessId" uuid, 
            CONSTRAINT "PK_8f8e123304561dc134560731001" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_business_email" ON "networks" ("businessId", "email") WHERE "email" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_business_phone" ON "networks" ("businessId", "phone")`);
        await queryRunner.query(`ALTER TABLE "networks" ADD CONSTRAINT "FK_networks_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "networks" DROP CONSTRAINT "FK_networks_business"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_unique_business_phone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_unique_business_email"`);
        await queryRunner.query(`DROP TABLE "networks"`);
        await queryRunner.query(`DROP TYPE "public"."networks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."networks_relationshiptag_enum"`);
        await queryRunner.query(`DROP TYPE "public"."networks_locationtag_enum"`);
    }
}
