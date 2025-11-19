import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plaque } from './entities/plaque.entity';
import { ScanEvent } from './entities/scan-event.entity';
import { BusinessService } from '../business/services/business.service';
import { GroupService } from '../group/group.service';
import { LedgerService } from '../ledger/ledger.service';
import { NotificationService } from '../notification/notification.service';
import { AssetService } from '../asset/asset.service';
import { AssignPlaqueDto } from './dto/assign-plaque.dto';
import { PlaqueStatus } from './entities/enums/plaque-status.enum';
import { TransferPlaqueDto } from './dto/transfer-plaque.dto';
import { CreateScanEventDto } from './dto/create-scan-event.dto';
import { CreatePlaqueDto } from './dto/create-plaque.dto';

@Injectable()
export class PlaqueService {
  constructor(
    @InjectRepository(Plaque)
    private readonly plaqueRepository: Repository<Plaque>,
    @InjectRepository(ScanEvent)
    private readonly scanEventRepository: Repository<ScanEvent>,
    private readonly businessService: BusinessService,
    private readonly groupService: GroupService,
    private readonly ledgerService: LedgerService,
    private readonly notificationService: NotificationService,
    private readonly assetService: AssetService,
  ) {}

  async createPlaque(
    createPlaqueDto: CreatePlaqueDto,
    ownerId: string,
  ): Promise<Plaque> {
    const owner = await this.businessService.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found.');
    }

    const group = await this.groupService.findById(createPlaqueDto.group_id);
    if (!group) {
      throw new NotFoundException('Group not found.');
    }

    const plaque = this.plaqueRepository.create({
      group,
      current_owner: owner,
      original_seller: owner,
      last_seller: owner,
    });

    const savedPlaque = await this.plaqueRepository.save(plaque);

    savedPlaque.qr_code_url = this.assetService.generateQrCodeUrl(savedPlaque.id);
    savedPlaque.print_pdf_url = this.assetService.generatePrintPdfUrl(
      savedPlaque.id,
    );

    return this.plaqueRepository.save(savedPlaque);
  }

  async createScanEvent(
    createScanEventDto: CreateScanEventDto,
  ): Promise<ScanEvent> {
    const plaque = await this.plaqueRepository.findOne({
      where: { id: createScanEventDto.plaque_id },
    });

    if (!plaque) {
      throw new NotFoundException('Plaque not found.');
    }

    const scanEvent = this.scanEventRepository.create({
      ...createScanEventDto,
      plaque,
    });

    plaque.scan_count += 1;
    await this.plaqueRepository.save(plaque);

    console.log(
      `Scan event created for plaque ${plaque.id} with attribution mode ${plaque.attribution_mode}`,
    );

    return this.scanEventRepository.save(scanEvent);
  }

  async assignPlaque(
    plaqueId: string,
    assignPlaqueDto: AssignPlaqueDto,
    ownerId: string,
  ): Promise<Plaque> {
    const plaque = await this.plaqueRepository.findOne({
      where: { id: plaqueId, current_owner: { id: ownerId } },
    });

    if (!plaque) {
      throw new NotFoundException('Plaque not found or you are not the owner.');
    }

    // If a partner business ID is provided, check if the business exists.
    if (assignPlaqueDto.partner_business_id) {
      await this.businessService.findById(assignPlaqueDto.partner_business_id);
    }

    plaque.status = PlaqueStatus.ASSIGNED;
    plaque.date_assigned = new Date();
    plaque.metadata = {
      ...plaque.metadata,
      partner_details: assignPlaqueDto,
    };

    const partner = await this.businessService.findByEmail(
      assignPlaqueDto.partner_contact_email,
    );
    if (partner) {
      this.notificationService.send(
        partner.id,
        `You have been invited to manage a plaque.`,
      );
    }
    if (partner && plaque.group) {
      const plaqueRoleToGroupRole = {
        advertiser: 'member',
        reseller: 'member',
        'co-owner': 'admin',
      };
      const groupRole =
        plaqueRoleToGroupRole[assignPlaqueDto.plaque_role] || 'member';

      await this.groupService.invitePartner(
        plaque.group.id,
        {
          partner_email: partner.email,
          role: groupRole as any,
        },
        ownerId,
      );
    }

    return this.plaqueRepository.save(plaque);
  }

  async transferPlaque(
    plaqueId: string,
    transferPlaqueDto: TransferPlaqueDto,
    sellerId: string,
  ): Promise<Plaque> {
    const plaque = await this.plaqueRepository.findOne({
      where: { id: plaqueId, current_owner: { id: sellerId } },
    });

    if (!plaque) {
      throw new NotFoundException('Plaque not found or you are not the owner.');
    }

    const buyer = await this.businessService.findById(
      transferPlaqueDto.to_owner_id,
    );

    const seller = await this.businessService.findById(sellerId);

    const transferRecord = {
      from_owner_id: sellerId,
      to_owner_id: transferPlaqueDto.to_owner_id,
      seller_id: sellerId,
      buyer_id: transferPlaqueDto.to_owner_id,
      transfer_date: new Date(),
      price: transferPlaqueDto.price,
      invoice_id: transferPlaqueDto.invoice_id,
    };

    plaque.transfer_history = [
      ...(plaque.transfer_history || []),
      transferRecord,
    ];
    plaque.current_owner = buyer;
    plaque.last_seller = seller;
    plaque.sold_price = transferPlaqueDto.price;
    plaque.date_sold = new Date();
    plaque.status = PlaqueStatus.TRANSFERRED;

    if (!plaque.original_seller) {
      plaque.original_seller = seller;
    }

    this.ledgerService.create({
      plaqueId: plaque.id,
      price: transferPlaqueDto.price,
      sellerId,
      buyerId: transferPlaqueDto.to_owner_id,
    });

    this.notificationService.send(sellerId, `Your plaque has been sold.`);
    this.notificationService.send(
      transferPlaqueDto.to_owner_id,
      `You have purchased a plaque.`,
    );

    return this.plaqueRepository.save(plaque);
  }

  async markForSale(
    plaqueId: string,
    markForSaleDto: any,
    ownerId: string,
  ): Promise<Plaque> {
    const plaque = await this.plaqueRepository.findOne({
      where: { id: plaqueId, current_owner: { id: ownerId } },
    });

    if (!plaque) {
      throw new NotFoundException('Plaque not found or you are not the owner.');
    }

    plaque.status = PlaqueStatus.FOR_SALE;
    plaque.price = markForSaleDto.price;

    return this.plaqueRepository.save(plaque);
  }
}
