import { Entity, Column } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Role } from "../../../common/role.enum";

@Entity("admins")
export class Admin extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.Admin })
  role: Role;
}
