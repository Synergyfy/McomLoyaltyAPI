import { SetMetadata } from "@nestjs/common";
import { ActionType } from "../capability.service";

export const CHECK_PERMISSION_KEY = "check_permission";

export interface PermissionContext {
  isFromScratch?: boolean;
  [key: string]: any;
}

export const CheckPermission = (
  action: ActionType,
  context: PermissionContext = {},
) => SetMetadata(CHECK_PERMISSION_KEY, { action, context });
