import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { HashService } from '../common/hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../resources/otp/otp.service';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (user && await this.hashService.comparePassword(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid login credentials');
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id, role: user.role };
    return {
      user: {
        name: user.name,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpService.create(email, otp);
    await this.mailService.sendOtp(email, otp);

    return { message: 'OTP sent successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const otp = await this.otpService.findOne(
      resetPasswordDto.email,
      resetPasswordDto.otp,
    );

    if (!otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (otp.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    const user = await this.userService.findOne(resetPasswordDto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.password = await this.hashService.hashPassword(
      resetPasswordDto.password,
    );
    await this.userService.save(user);

    await this.otpService.remove(otp.id);

    return { message: 'Password reset successfully' };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findOne(payload.username);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}