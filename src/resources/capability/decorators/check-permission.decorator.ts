import { SetMetadata } from '@nestjs/common';
import { ActionType } from '../capability.service';

export const CHECK_PERMISSION_KEY = 'check_permission';
export const CheckPermission = (action: ActionType) => SetMetadata(CHECK_PERMISSION_KEY, action);
