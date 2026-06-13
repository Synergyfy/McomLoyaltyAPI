import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameFieldsToUsers1771432944456 implements MigrationInterface {
  name = "AddNameFieldsToUsers1771432944456";

  public async up(queryRunner: QueryRunner): Promise<void> {}

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
