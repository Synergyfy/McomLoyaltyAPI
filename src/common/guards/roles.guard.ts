import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../role.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_MEMBERSHIP_CHECK_KEY } from "../decorators/skip-membership-check.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    if (
      user.role === Role.Business &&
      !user.isEmailVerified &&
      requiredRoles.includes(Role.Business)
    ) {
      return false;
    }

    const skipSubscriptionCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_MEMBERSHIP_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Check for active subscription for Business role
    if (
      user.role === Role.Business &&
      requiredRoles.includes(Role.Business) &&
      !user.hasActiveSubscription &&
      !skipSubscriptionCheck
    ) {
      // Allow access to auth related endpoints or subscription setup endpoints if we had them excluded, but for now block everything else.
      // Ideally we might whitelist some endpoints, but user said "any business role guarded endpoint"
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
