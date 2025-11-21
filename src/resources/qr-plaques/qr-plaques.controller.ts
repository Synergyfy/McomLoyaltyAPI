import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QrPlaquesService } from './qr-plaques.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/role.enum';

@ApiTags('QR Plaques')
@Controller('qr-plaques')
export class QrPlaquesController {
    constructor(private readonly qrPlaquesService: QrPlaquesService) { }

    @Get('business')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all QR plaques for the current business' })
    async findAllForBusiness(@Req() req) {
        return this.qrPlaquesService.findAllForBusiness(req.user.id);
    }

    @Get(':code')
    @ApiOperation({ summary: 'Get a QR plaque by its code' })
    async findOne(@Param('code') code: string) {
        return this.qrPlaquesService.findOneByCode(code);
    }

    @Post(':id/invite')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Business)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Invite a user to claim a plaque' })
    async inviteUser(@Param('id') id: string, @Body('email') email: string) {
        return this.qrPlaquesService.inviteUser(id, email);
    }

    @Post('verify-invite')
    @ApiOperation({ summary: 'Verify an invite code and claim plaque' })
    async verifyInvite(@Body('code') code: string, @Body('email') email: string) {
        return this.qrPlaquesService.verifyInvite(code, email);
    }
}
