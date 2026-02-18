import { Entity, Column, BeforeInsert, BeforeUpdate } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Role } from "../../../common/role.enum";

@Entity("admins")
export class Admin extends AbstractBaseEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  name: string;

  @BeforeInsert()
  @BeforeUpdate()
  updateName() {
    if (this.firstName || this.lastName) {
      this.name = `${this.firstName || ""} ${this.lastName || ""}`.trim();
    }
  }

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.Admin })
  role: Role;
}
