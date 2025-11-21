import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrPlaque, QrPlaqueStatus } from './entities/qr-plaque.entity';
import { Business } from '../business/entities/business.entity';
import { Partner } from '../partner/entities/partner.entity';
import { MailService } from '../../mail/mail.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateQrPlaqueDto } from './dto/update-qr-plaque.dto';

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

    async findAllAdmin(paginationDto: PaginationDto) {
        const { page, limit } = paginationDto;
        const [data, total] = await this.qrPlaqueRepository.findAndCount({
            take: limit,
            skip: (page - 1) * limit,
            order: { created_at: 'DESC' },
            relations: ['codeMaster', 'assignedPartner', 'assignedBusiness'],
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async update(id: string, updateQrPlaqueDto: UpdateQrPlaqueDto) {
        const plaque = await this.qrPlaqueRepository.findOne({ where: { id } });
        if (!plaque) {
            throw new NotFoundException(`QR Plaque with ID ${id} not found`);
        }

        const { assignedPartnerId, assignedBusinessId, ...rest } = updateQrPlaqueDto;

        Object.assign(plaque, rest);

        if (assignedPartnerId) {
            const partner = await this.partnerRepository.findOne({ where: { id: assignedPartnerId } });
            if (!partner) {
                throw new NotFoundException(`Partner with ID ${assignedPartnerId} not found`);
            }
            plaque.assignedPartner = partner;
        } else if (assignedPartnerId === null) { // Handle explicit null if needed, though optional usually means ignore
            plaque.assignedPartner = null;
        }

        if (assignedBusinessId) {
            const business = await this.businessRepository.findOne({ where: { id: assignedBusinessId } });
            if (!business) {
                throw new NotFoundException(`Business with ID ${assignedBusinessId} not found`);
            }
            plaque.assignedBusiness = business;
        } else if (assignedBusinessId === null) {
            plaque.assignedBusiness = null;
        }

        return this.qrPlaqueRepository.save(plaque);
    }

    async remove(id: string) {
        const plaque = await this.qrPlaqueRepository.findOne({ where: { id } });
        if (!plaque) {
            throw new NotFoundException(`QR Plaque with ID ${id} not found`);
        }
        return this.qrPlaqueRepository.remove(plaque);
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
            throw new NotFoundException('Plaque not found');
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
            throw new NotFoundException('Invalid code or email');
        }

        const partner = await this.partnerRepository.findOne({ where: { email } });
        if (partner) {
            plaque.assignedPartner = partner;
            plaque.status = QrPlaqueStatus.ACTIVE;
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

        return { message: 'Code verified. Please register to claim plaque.', plaqueId: plaque.id };
    }
}
