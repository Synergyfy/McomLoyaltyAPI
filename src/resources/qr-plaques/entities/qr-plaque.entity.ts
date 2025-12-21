import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { AbstractBaseEntity } from "../../../database/entities/base.entity";
import { Business } from "../../business/entities/business.entity";
import { Partner } from "../../partner/entities/partner.entity";
import { Network } from "../../network/entities/network.entity";
import { ApiProperty } from "@nestjs/swagger";

export enum QrPlaqueStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ASSIGNED = "ASSIGNED", // Indicates assigned but possibly not yet fully active/claimed if that was the flow, or just "owned"
  FOR_SALE = "FOR_SALE",
}

@Entity("qr_plaques")
@Index(["name", "description"]) // For search
export class QrPlaque extends AbstractBaseEntity {
  @ApiProperty({ description: "Unique 9-digit alphanumeric code (ALL CAPS)" })
  @Column({ unique: true, length: 9 })
  uniqueCode: string;

  // Keeping 'code' for backward compatibility if needed, or mapping it to uniqueCode.
  // The requirement said "a 9 digit... unique code aside their uuid".
  // The existing entity had 'code'. I'll assume 'code' IS the 'uniqueCode' or I should rename it.
  // Given the prompt "change the way we use plaque", I'll treat 'uniqueCode' as the primary code field.
  // I will use 'unique_code' as the column name to differ from 'code' if I must, but 'code' is cleaner.
  // Let's stick to 'uniqueCode' property name, mapped to 'unique_code' column if we want to be explicit,
  // or just 'code' column if we reuse.
  // "also each plaque should have a 9 digit alpha numeric unqiue code aside their uuid"
  // The existing 'code' was 9 digits. I will reuse the 'code' column but rename the property to avoid confusion if needed,
  // or just keep 'code'. Let's use 'code' as the property for simplicity but validation will enforce constraints.

  @ApiProperty({ description: "Legacy 9-digit code", required: false })
  @Column({ unique: true, length: 9, name: "code" })
  code: string;

  @ApiProperty({ description: "Name of the plaque" })
  @Column()
  name: string;

  @ApiProperty({ description: "Description of the plaque" })
  @Column({ type: "text" })
  description: string;

  @ApiProperty({ description: "Action text displayed on the plaque" })
  @Column({ name: "action_text" })
  actionText: string;

  @ApiProperty({
    description: "Footer text displayed on the plaque",
    required: false,
  })
  @Column({ name: "footer_text", nullable: true })
  footerText: string;

  @ApiProperty({
    description: "URL where the interaction leads",
    example: "https://example.com",
  })
  @Column({ name: "content_url" })
  contentUrl: string;

  @ApiProperty({
    description: "URL of the generated QR code image",
    required: false,
  })
  @Column({ name: "qr_code_url", nullable: true })
  qrCodeUrl: string;

  @ApiProperty({ description: "Sale price in GBP", required: false })
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;

  @ApiProperty({
    enum: QrPlaqueStatus,
    description: "Current status of the plaque",
  })
  @Column({
    type: "enum",
    enum: QrPlaqueStatus,
    default: QrPlaqueStatus.PENDING,
  })
  status: QrPlaqueStatus;

  // Relationships

  @ApiProperty({
    type: () => Partner,
    description: "Owner of the plaque (if assigned to self/partner)",
  })
  @ManyToOne(() => Partner, { nullable: true })
  @JoinColumn({ name: "assigned_partner_id" })
  assignedPartner: Partner;

  @ApiProperty({
    type: () => Business,
    description: "Business that owns/created the plaque",
  })
  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: "assigned_business_id" })
  assignedBusiness: Business;

  @ApiProperty({
    type: () => Network,
    description: "Network contact assigned to the plaque (pending acceptance)",
  })
  @ManyToOne(() => Network, { nullable: true })
  @JoinColumn({ name: "network_contact_id" })
  networkContact: Network;

  @ApiProperty({
    description: "Code for accepting the assignment (sent to network contact)",
  })
  @Column({ name: "assignment_code", nullable: true, select: false })
  assignmentCode: string;

  // Removed link, pendingInviteEmail, pendingInviteCode as they are replaced by new logic/fields
}
