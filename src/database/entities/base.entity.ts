import { ApiProperty } from "@nestjs/swagger";
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class AbstractBaseEntity {
  @ApiProperty({ description: "The unique identifier of the entity" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ description: "The date when the entity was created" })
  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @ApiProperty({ description: "The date when the entity was last updated" })
  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  @ApiProperty({ description: "The date when the entity was soft deleted" })
  @DeleteDateColumn({ name: "deleted_at" })
  deleted_at: Date;
}
