import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Coupon } from "./entities/coupon.entity";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const coupon = this.couponRepository.create(createCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async findAll() {
    return await this.couponRepository.find();
  }

  async findOne(id: string) {
    return await this.couponRepository.findOne({ where: { id } });
  }

  async findByCode(code: string) {
    return await this.couponRepository.findOne({ where: { code } });
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    await this.couponRepository.update(id, updateCouponDto);
    return await this.findOne(id);
  }

  async remove(id: string) {
    await this.couponRepository.softDelete(id);
  }
}
