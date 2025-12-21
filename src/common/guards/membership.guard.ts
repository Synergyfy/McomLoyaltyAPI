import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MembershipService } from "../../resources/membership/membership.service";
import { SKIP_MEMBERSHIP_CHECK_KEY } from "../decorators/skip-membership-check.decorator";
import { Role } from "../role.enum";

@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_MEMBERSHIP_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== Role.Business) {
      return true; // Only restrict businesses
    }

    const membership = await this.membershipService.findOneByBusinessId(
      user.id,
    );

    if (!membership) {
      // If no membership, maybe they should be restricted too?
      // But the requirement specifically mentions "once the trial expires".
      // Let's assume if they have no membership, they might be in a state where they need to join one.
      // But if they are a business, they should probably have a membership to do anything useful.
      // For now, let's focus on the trial expiration.
      return true;
    }

    if (membership.is_trial && new Date(membership.expires_at) < new Date()) {
      throw new ForbiddenException(
        "Trial expired. Please subscribe to continue.",
      );
    }

    return true;
  }
}
