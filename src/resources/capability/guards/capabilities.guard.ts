import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CapabilityService, ActionType } from '../capability.service';
import { CHECK_PERMISSION_KEY } from '../decorators/check-permission.decorator';
import { Role } from '../../../common/role.enum';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private capabilityService: CapabilityService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const action = this.reflector.getAllAndOverride<ActionType>(CHECK_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!action) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Only check permissions for Business users
        if (!user || user.role !== Role.Business) {
            return true;
        }

        const permissionContext = this.extractContext(action, request);
        await this.capabilityService.checkPermission(user.id, action, permissionContext);

        return true;
    }

    private extractContext(action: ActionType, request: any): any {
        const body = request.body;
        const params = request.params;

        switch (action) {
            case ActionType.CREATE_CAMPAIGN:
                return {
                    isFromScratch: true, // Assuming usage on create endpoint implies from scratch or logic handled in service
                    rewardCount: body.business_reward_ids?.length || 0,
                };
            case ActionType.UPDATE_CAMPAIGN:
                return {
                    rewardCount: body.business_reward_ids?.length || 0,
                };
            case ActionType.CREATE_REWARD:
                return {
                    campaignId: body.campaignId || params.campaignId,
                };
            default:
                return {};
        }
    }
}
