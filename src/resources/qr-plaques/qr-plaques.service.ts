import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrPlaque, QrPlaqueStatus } from './entities/qr-plaque.entity';
import { Business } from '../business/entities/business.entity';
import { Partner } from '../partner/entities/partner.entity';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class QrPlaquesService {
    constructor(
        @InjectRepository(QrPlaque)
        private readonly qrPlaqueRepository: Repository<QrPlaque>,
        @InjectRepository(Partner)
        private readonly partnerRepository: Repository<Partner>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        private readonly mailService: MailService,
    ) { }

    private generateUniqueCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 9; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async ensurePlaqueCountForBusiness(business: Business, targetCount: number) {
        const currentCount = await this.qrPlaqueRepository.count({
            where: { codeMaster: { id: business.id } },
        });

        if (currentCount >= targetCount) {
            return;
        }

        const needed = targetCount - currentCount;
        const plaques: QrPlaque[] = [];

        for (let i = 0; i < needed; i++) {
            let isUnique = false;
            let code = '';
            while (!isUnique) {
                code = this.generateUniqueCode();
                const existing = await this.qrPlaqueRepository.findOne({ where: { code } });
                if (!existing) {
                    isUnique = true;
                }
            }

            const plaque = this.qrPlaqueRepository.create({
                code,
                codeMaster: business,
                status: QrPlaqueStatus.PENDING_ASSIGNMENT,
            });
            plaques.push(plaque);
        }
        return await this.qrPlaqueRepository.save(plaques);
    }

    async findAllForBusiness(businessId: string) {
        return this.qrPlaqueRepository.find({
            where: { codeMaster: { id: businessId } },
            relations: ['assignedPartner', 'assignedBusiness'],
        });
    }

    async findOneByCode(code: string) {
        return this.qrPlaqueRepository.findOne({
            where: { code },
            relations: ['codeMaster', 'assignedPartner', 'assignedBusiness'],
        });
    }

    async inviteUser(plaqueId: string, email: string) {
        const plaque = await this.qrPlaqueRepository.findOne({ where: { id: plaqueId } });
        if (!plaque) {
            throw new Error('Plaque not found');
        }

        const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
        plaque.pendingInviteEmail = email;
        plaque.pendingInviteCode = inviteCode;
        await this.qrPlaqueRepository.save(plaque);

        await this.mailService.sendInviteEmail(email, inviteCode);
        console.log(`Sending invite to ${email} with code ${inviteCode}`);

        return { message: 'Invite sent' };
    }

    async verifyInvite(code: string, email: string) {
        const plaque = await this.qrPlaqueRepository.findOne({ where: { pendingInviteCode: code, pendingInviteEmail: email } });
        if (!plaque) {
            throw new Error('Invalid code or email');
        }

        const partner = await this.partnerRepository.findOne({ where: { email } });
        if (partner) {
            plaque.assignedPartner = partner;
            plaque.status = QrPlaqueStatus.ACTIVE; // Or keep as PENDING_ASSIGNMENT until confirmed? Assuming ACTIVE.
            plaque.pendingInviteCode = null;
            plaque.pendingInviteEmail = null;
            return await this.qrPlaqueRepository.save(plaque);
        }

        const business = await this.businessRepository.findOne({ where: { email } });
        if (business) {
            plaque.assignedBusiness = business;
            plaque.status = QrPlaqueStatus.ACTIVE;
            plaque.pendingInviteCode = null;
            plaque.pendingInviteEmail = null;
            return await this.qrPlaqueRepository.save(plaque);
        }

        // If user not found, we just return the plaque but don't assign yet?
        // Or maybe we assign the email to a "pending owner" field?
        // For now, returning success but not assigning relation.
        // The prompt says "automatically assigned". If they don't exist, we can't assign relation.
        // We'll assume they will register later.

        return { message: 'Code verified. Please register to claim plaque.', plaqueId: plaque.id };
    }
}
