import { Injectable, CanActivate, ExecutionContext, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../role.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class ImpersonationGuard implements CanActivate {
  private readonly logger = new Logger(ImpersonationGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const businessId = request.headers["x-business-id"];

    // Only apply if user is authenticated as Admin and provides a businessId header
    if (user && user.role === Role.Admin && businessId) {
      // Get required roles for this endpoint
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      // If the endpoint requires Business role, allow impersonation
      if (requiredRoles?.includes(Role.Business)) {
        this.logger.log(
          `Admin ${user.id} impersonating Business ${businessId} for endpoint: ${context.getHandler().name}`,
        );

        // Preserve original admin identity
        request.user.impersonator = { ...user };

        // Impersonate the business
        request.user.id = businessId;
        request.user.role = Role.Business;
        request.user.isEmailVerified = true;
        request.user.hasActiveSubscription = true;
      }
    }

    return true;
  }
}