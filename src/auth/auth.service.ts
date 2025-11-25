import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { HashService } from '../common/hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../resources/otp/otp.service';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../common/role.enum';
import { BusinessService } from '../resources/business/services/business.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Membership,
  MembershipStatus,
} from '../resources/membership/entities/membership.entity';
import { Repository } from 'typeorm';
import { PartnerService } from '../resources/partner/partner.service';
import { Business } from '../resources/business/entities/business.entity';
import { Staff } from '../resources/staff/entities/staff.entity';
import { Participant } from '../resources/participant/entities/participant.entity';
import { User } from 'src/common/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly businessService: BusinessService,
    private readonly partnerService: PartnerService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (user && (await this.hashService.comparePassword(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid login credentials');
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id, role: user.role };
    const response: any = {
      user: {
        name: user.name,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };

    if (user.role === Role.Business) {
      const business = await this.businessService.findById(user.id, ['sector']);
      response.user.isOnboarded = !!business.sector;

      const membership = await this.membershipRepository.findOne({
        where: { user_id: user.id, status: MembershipStatus.ACTIVE },
      });
      response.user.subscription = {
        isActive: !!membership,
        isTrial: membership ? membership.is_trial : false,
      };
    }

    return response;
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

  async validatePartner(email: string, pass: string): Promise<any> {
    const partner = await this.partnerService.findByEmail(email);
    if (
      partner &&
      (await this.hashService.comparePassword(pass, partner.password))
    ) {
      const { password, ...result } = partner;
      return result;
    }
    throw new UnauthorizedException('Invalid login credentials');
  }

  async loginPartner(partner: any) {
    const payload = {
      username: partner.email,
      sub: partner.id,
      role: Role.Partner,
    };
    return {
      user: {
        name: partner.name,
        role: Role.Partner,
      },
      access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async getUniqueCode(currentUser: User): Promise<{ uniqueCode: string }> {
    let user: Business | Staff | Participant;

    switch (currentUser.role) {
      case Role.Business:
        user = await this.businessRepository.findOneBy({ id: currentUser.id });
        break;
      case Role.Staff:
        user = await this.staffRepository.findOneBy({ id: currentUser.id });
        break;
      case Role.Participant:
        user = await this.participantRepository.findOneBy({
          id: currentUser.id,
        });
        break;
      default:
        throw new UnauthorizedException('User role not supported');
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    console.log(user);
    return { uniqueCode: user.uniqueCode };
  }
}
