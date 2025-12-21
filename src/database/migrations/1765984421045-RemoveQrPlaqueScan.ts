import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveQrPlaqueScan1765984421045 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "qr_plaque_scans"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Irreversible migration without schema definition
  }
}
