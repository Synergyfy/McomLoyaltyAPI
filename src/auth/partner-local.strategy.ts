import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class PartnerLocalStrategy extends PassportStrategy(
  Strategy,
  "partner-local",
) {
  constructor(private authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, pass: string): Promise<any> {
    const partner = await this.authService.validatePartner(email, pass);
    if (!partner) {
      throw new UnauthorizedException();
    }
    return partner;
  }
}
