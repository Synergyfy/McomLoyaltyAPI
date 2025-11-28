import { Test, TestingModule } from '@nestjs/testing';
import { CapabilitiesGuard } from './capabilities.guard';
import { Reflector } from '@nestjs/core';
import { CapabilityService, ActionType } from '../capability.service';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '../../../common/role.enum';

describe('CapabilitiesGuard Verification', () => {
    let guard: CapabilitiesGuard;
    let capabilityService: CapabilityService;
    let reflector: Reflector;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CapabilitiesGuard,
                {
                    provide: CapabilityService,
                    useValue: {
                        checkPermission: jest.fn(),
                    },
                },
                {
                    provide: Reflector,
                    useValue: {
                        getAllAndOverride: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<CapabilitiesGuard>(CapabilitiesGuard);
        capabilityService = module.get<CapabilityService>(CapabilityService);
        reflector = module.get<Reflector>(Reflector);
    });

    it('should allow access if no permission metadata is present', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { role: Role.Business } }),
            }),
        } as unknown as ExecutionContext;

        expect(await guard.canActivate(context)).toBe(true);
        expect(capabilityService.checkPermission).not.toHaveBeenCalled();
    });

    it('should call checkPermission with correct context for CREATE_CAMPAIGN', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(ActionType.CREATE_CAMPAIGN);
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { id: 'user-1', role: Role.Business },
                    body: { business_reward_ids: ['r1', 'r2'] },
                }),
            }),
        } as unknown as ExecutionContext;

        await guard.canActivate(context);

        expect(capabilityService.checkPermission).toHaveBeenCalledWith(
            'user-1',
            ActionType.CREATE_CAMPAIGN,
            { isFromScratch: true, rewardCount: 2 },
        );
    });

    it('should call checkPermission with correct context for ADD_REWARD_TO_BUSINESS', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(ActionType.ADD_REWARD_TO_BUSINESS);
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { id: 'user-1', role: Role.Business },
                    body: {},
                    params: {},
                }),
            }),
        } as unknown as ExecutionContext;

        await guard.canActivate(context);

        expect(capabilityService.checkPermission).toHaveBeenCalledWith(
            'user-1',
            ActionType.ADD_REWARD_TO_BUSINESS,
            {},
        );
    });
});
