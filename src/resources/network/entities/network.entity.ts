import { Entity, Column, ManyToOne, Index, ManyToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { ApiProperty } from '@nestjs/swagger';
import { NetworkList } from './network-list.entity';

export enum NetworkLocationTag {
    NEARBY = 'nearby',
    HYPERLOCAL = 'hyperlocal',
    NATIONAL = 'national',
}

export enum NetworkRelationshipTag {
    PARTNER = 'partner',
    CUSTOMER = 'customer',
    SUPPLIER = 'supplier',
    AFFILIATE = 'affiliate',
}

export enum NetworkStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Entity('networks')
@Index(['business', 'email'], { unique: true, where: '"email" IS NOT NULL' })
@Index(['business', 'phone'], { unique: true })
export class Network extends AbstractBaseEntity {
    @ApiProperty({ description: 'Permission to share information', default: false })
    @Column({ default: false })
    hasSharingPermission: boolean;
    @ApiProperty({ description: 'Full name of the network contact' })
    @Column()
    fullName: string;

    @ApiProperty({ description: 'Business name (optional)', required: false })
    @Column({ nullable: true })
    businessName: string;

    @ApiProperty({ description: 'Email address (optional)', required: false })
    @Column({ nullable: true })
    email: string;

    @ApiProperty({ description: 'Phone number' })
    @Column()
    phone: string;

    @ApiProperty({ enum: NetworkLocationTag, description: 'Location tag' })
    @Column({ type: 'enum', enum: NetworkLocationTag })
    locationTag: NetworkLocationTag;

    @ApiProperty({ enum: NetworkRelationshipTag, description: 'Relationship tag' })
    @Column({ type: 'enum', enum: NetworkRelationshipTag })
    relationshipTag: NetworkRelationshipTag;

    @ApiProperty({ description: 'Status of the network invitation', default: NetworkStatus.PENDING })
    @Column({ type: 'enum', enum: NetworkStatus, default: NetworkStatus.PENDING })
    status: NetworkStatus;

    @ApiProperty({ description: 'Permission status', default: 'pending' })
    @Column({ default: 'pending' })
    permission: string;

    @ManyToOne(() => Business, (business) => business.network)
    business: Business;

    @ManyToMany(() => NetworkList, (networkList) => networkList.networks)
    networkLists: NetworkList[];

    @ApiProperty({ description: 'Whether the contact has onboarded as a partner or business', default: false })
    @Column({ default: false })
    isOnboarded: boolean;

    @ApiProperty({ description: 'The type of entity the contact onboarded as', enum: ['partner', 'business'], required: false })
    @Column({ type: 'enum', enum: ['partner', 'business'], nullable: true })
    onboardedType: 'partner' | 'business';

    @ApiProperty({ description: 'The ID of the created business (if applicable)', required: false })
    @Column({ nullable: true })
    onboardedBusinessId: string;

    @ApiProperty({ description: 'The ID of the created partner (if applicable)', required: false })
    @Column({ nullable: true })
    onboardedPartnerId: string;
}
