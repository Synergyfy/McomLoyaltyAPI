
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { HashService } from '../../../common/hash/hash.service';
import { JwtService } from '@nestjs/jwt';
import { LoginAdminDto } from '../dto/login-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.adminService.findByEmail(email);
    if (user && await this.hashService.comparePassword(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginAdminDto: LoginAdminDto) {
    const user = await this.validateUser(loginAdminDto.email, loginAdminDto.password);
    if (!user) {
        throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
