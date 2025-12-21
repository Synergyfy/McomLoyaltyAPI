import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Otp } from "./entities/otp.entity";

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  async create(email: string, otp: string): Promise<Otp> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    const newOtp = this.otpRepository.create({ email, otp, expiresAt });
    return this.otpRepository.save(newOtp);
  }

  async findOne(email: string, otp: string): Promise<Otp> {
    return this.otpRepository.findOne({ where: { email, otp } });
  }

  async remove(id: number): Promise<void> {
    await this.otpRepository.delete(id);
  }
}
