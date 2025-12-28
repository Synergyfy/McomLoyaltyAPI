import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { HashService } from "../common/hash/hash.service";
import { JwtService } from "@nestjs/jwt";
import { OtpService } from "../resources/otp/otp.service";
import { MailService } from "../mail/mail.service";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Role } from "../common/role.enum";
import { BusinessService } from "../resources/business/services/business.service";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Membership,
  MembershipStatus,
} from "../resources/membership/entities/membership.entity";
import { Repository } from "typeorm";
import { PartnerService } from "../resources/partner/partner.service";
import { Business } from "../resources/business/entities/business.entity";
import { Staff } from "../resources/staff/entities/staff.entity";
import { Participant } from "../resources/participant/entities/participant.entity";
import { User } from "src/common/interfaces/user.interface";

import { ParticipantProgressionService } from "../resources/participant-progression/participant-progression.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => BusinessService))
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
    private readonly progressionService: ParticipantProgressionService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (user && (await this.hashService.comparePassword(pass, user.password))) {
      const { password, ...result } = user;
      return { ...result, isEmailVerified: user.isEmailVerified };
    }
    throw new UnauthorizedException("Invalid login credentials");
  }

  async login(user: any) {
    const payload: any = {
      username: user.email,
      sub: user.id,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    // Default response structure
    const response: any = {
      user: {
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      // Tokens will be signed after payload finalization
    };

    if (user.role === Role.Participant) {
      // Trigger Daily Login Reward
      await this.progressionService.handleLoginStreak(user.id);
      this.progressionService.triggerAction(user.id, "LOGIN_DAILY");
    }

    if (user.role === Role.Business) {
      const business = await this.businessService.findById(user.id, ["sector"]);
      // Graceful fallback if business record is missing but auth user exists (e.g. inconsistency)
      if (business) {
        response.user.isOnboarded = !!business.sector;
      } else {
        response.user.isOnboarded = false;
        // Log inconsistency? console.warn(`Business record missing for user ${user.id}`);
      }

      const membership = await this.membershipRepository.findOne({
        where: { business: { id: user.id } },
        order: { created_at: "DESC" },
      });

      const isTrialValid =
        membership &&
        membership.is_trial &&
        new Date(membership.expires_at) > new Date();
      const isActive =
        membership && membership.status === MembershipStatus.ACTIVE;

      const hasActiveSubscription = isActive || isTrialValid;

      response.user.subscription = {
        isActive: isActive,
        isTrial: membership ? membership.is_trial : false,
      };

      // Add subscription status to payload for Business users
      payload.hasActiveSubscription = hasActiveSubscription;
    }

    // Sign tokens once with the final payload
    response.access_token = this.jwtService.sign(payload, { expiresIn: "1h" });
    response.refresh_token = this.jwtService.sign(payload, { expiresIn: "7d" });

    return response;
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpService.create(email, otp);
    await this.mailService.sendOtp(email, otp);

    return { message: "OTP sent successfully" };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new UnauthorizedException("Passwords do not match");
    }

    const otp = await this.otpService.findOne(
      resetPasswordDto.email,
      resetPasswordDto.otp,
    );

    if (!otp) {
      throw new UnauthorizedException("Invalid OTP");
    }

    if (otp.expiresAt < new Date()) {
      throw new UnauthorizedException("OTP has expired");
    }

    const user = await this.userService.findOne(resetPasswordDto.email);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    user.password = await this.hashService.hashPassword(
      resetPasswordDto.password,
    );
    await this.userService.save(user);

    await this.otpService.remove(otp.id);

    return { message: "Password reset successfully" };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findOne(payload.username);
      if (!user) {
        throw new UnauthorizedException("Invalid token");
      }
      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException("Invalid token");
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
    throw new UnauthorizedException("Invalid login credentials");
  }

  async verifyEmail(email: string, otp: string) {
    const validOtp = await this.otpService.findOne(email, otp);

    if (!validOtp) {
      throw new UnauthorizedException("Invalid OTP");
    }

    if (validOtp.expiresAt < new Date()) {
      throw new UnauthorizedException("OTP has expired");
    }

    let user: Business | Participant;
    let userType: "business" | "participant";

    // Try finding in Business
    user = await this.businessRepository.findOneBy({ email });
    if (user) {
      userType = "business";
    } else {
      // Try finding in Participant
      user = await this.participantRepository.findOneBy({ email });
      if (user) {
        userType = "participant";
      }
    }

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.isEmailVerified) {
      return { message: "Email already verified" };
    }

    user.isEmailVerified = true;

    if (userType === "business") {
      await this.businessRepository.save(user as Business);
    } else {
      await this.participantRepository.save(user as Participant);
      // Trigger Email Verified Reward
      this.progressionService.triggerAction(user.id, "EMAIL_VERIFIED");
    }

    await this.otpService.remove(validOtp.id);

    // Generate new token for the user with isEmailVerified: true
    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
      isEmailVerified: true,
      hasActiveSubscription: false,
    };

    if (userType === "business") {
      const membership = await this.membershipRepository.findOne({
        where: { business: { id: user.id } },
        order: { created_at: "DESC" },
      });

      const isTrialValid =
        membership &&
        membership.is_trial &&
        new Date(membership.expires_at) > new Date();
      const isActive =
        membership && membership.status === MembershipStatus.ACTIVE;

      payload.hasActiveSubscription = isActive || isTrialValid;
    }

    return {
      message: "Email verified successfully",
      access_token: this.jwtService.sign(payload, { expiresIn: "1h" }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: "7d" }),
    };
  }

  async resendVerificationOtp(email: string) {
    let user: Business | Participant;

    // Try finding in Business
    user = await this.businessRepository.findOneBy({ email });
    if (!user) {
      // Try finding in Participant
      user = await this.participantRepository.findOneBy({ email });
    }

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.isEmailVerified) {
      return { message: "Account is already verified" };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpService.create(user.email, otp);
    await this.mailService.sendOtp(user.email, otp);

    return { message: "OTP sent successfully" };
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
      access_token: this.jwtService.sign(payload, { expiresIn: "1h" }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: "7d" }),
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
        throw new UnauthorizedException("User role not supported");
    }

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    console.log(user);
    return { uniqueCode: user.uniqueCode };
  }

  async getSsoToken(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      iss: "mcom-loyalty",
      aud: "mcom-mall",
    };
    // In production, use a separate secret for SSO
    const secret = process.env.SSO_SECRET || "shared-sso-secret";
    return {
      sso_token: this.jwtService.sign(payload, { secret, expiresIn: "5m" }),
      redirect_url: `${process.env.MALL_APP_URL || "http://localhost:3001"}/sso/callback`,
    };
  }
}
