import { Entity, Column, BeforeUpdate, BeforeInsert } from 'typeorm';
import { AbstractBaseEntity } from 'src/database/entities/base.entity';
import { VoucherType } from './voucher-type.enum';
import { VoucherValueType } from './voucher-value-type.enum';
import { VoucherStatus } from './voucher-status.enum';
import { Role } from 'src/common/role.enum';

@Entity()
export class Voucher extends AbstractBaseEntity {
  @Column({ type: 'uuid' })
  creatorId: string;

  @Column({ type: 'enum', enum: [Role.Admin, Role.Business] })
  creatorType: Role;

  @Column({
    type: 'enum',
    enum: VoucherType,
  })
  type: VoucherType;

  @Column()
  title: string;

  @Column({ type: 'decimal' })
  valueCost: number;

  @Column({
    type: 'enum',
    enum: VoucherValueType,
  })
  valueType: VoucherValueType;

  @Column()
  expiryDate: Date;

  @Column({ type: 'integer' })
  totalQuantity: number;

  @Column({ type: 'integer', default: 0 })
  redeemedQuantity: number;

  @Column()
  redemptionRules: string;

  @Column({
    type: 'enum',
    enum: VoucherStatus,
  })
  status: VoucherStatus;

  @BeforeInsert()
  @BeforeUpdate()
  updateStatus(): void {
    if (this.expiryDate < new Date()) {
      this.status = VoucherStatus.EXPIRED;
    } else if (this.redeemedQuantity >= this.totalQuantity) {
      this.status = VoucherStatus.FULFILLED;
    } else if (this.redeemedQuantity > 0) {
      this.status = VoucherStatus.PARTIALLY_REDEEMED;
    } else {
      this.status = VoucherStatus.ACTIVE;
    }
  }
}
