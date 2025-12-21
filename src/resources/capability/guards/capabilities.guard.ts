import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CapabilityService, ActionType } from "../capability.service";
import {
  CHECK_PERMISSION_KEY,
  PermissionContext,
} from "../decorators/check-permission.decorator";
import { Role } from "../../../common/role.enum";

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private capabilityService: CapabilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<{
      action: ActionType;
      context: PermissionContext;
    }>(CHECK_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) {
      return true;
    }

    const { action, context: staticContext } = metadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    // Exclude Admin from checks
    if (user.role === Role.Admin) {
      return true;
    }

    // Only enforce for Business
    if (user.role !== Role.Business) {
      return true;
    }

    const dynamicContext = this.extractContext(action, request);
    const finalContext = { ...staticContext, ...dynamicContext };

    await this.capabilityService.checkPermission(user.id, action, finalContext);

    return true;
  }

  private extractContext(action: ActionType, request: any): any {
    const body = request.body;

    switch (action) {
      case ActionType.CREATE_CAMPAIGN:
      case ActionType.UPDATE_CAMPAIGN:
        return {
          rewardCount: body.business_reward_ids
            ? body.business_reward_ids.length
            : 0,
        };
      case ActionType.CREATE_REWARD:
        return {
          campaignId: body.campaignId || request.params.campaignId,
        };
      default:
        return {};
    }
  }
}
