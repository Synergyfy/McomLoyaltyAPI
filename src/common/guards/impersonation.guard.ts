import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
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
    const participantId = request.headers["x-participant-id"];

    // Only apply if user is authenticated as Admin
    if (user && user.role === Role.Admin) {
      // Get required roles for this endpoint
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      // Handle Business Impersonation
      if (businessId && requiredRoles?.includes(Role.Business)) {
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

      // Handle Participant Impersonation
      else if (participantId && requiredRoles?.includes(Role.Participant)) {
        this.logger.log(
          `Admin ${user.id} impersonating Participant ${participantId} for endpoint: ${context.getHandler().name}`,
        );

        // Preserve original admin identity
        request.user.impersonator = { ...user };

        // Impersonate the participant
        request.user.id = participantId;
        request.user.role = Role.Participant;
        request.user.isEmailVerified = true;
        // Participants typically don't have subscriptions in the same way,
        // or we can default to true if it's checked.
        // Adjust based on Participant entity if needed.
      }
    }

    return true;
  }
}
