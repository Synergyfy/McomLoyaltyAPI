
import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Role } from "../../../common/role.enum";

@Entity("staff")
export class Staff extends AbstractBaseEntity {
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
      this.name = `${this.firstName || ""} ${this.lastName || ""} `.trim();
    }
  }

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @ManyToOne(() => Business, (business) => business.staff)
  business: Business;

  @Column({ unique: true })
  uniqueCode: string;

  @Column({ type: "enum", enum: Role, default: Role.Staff })
  role: Role;
}
