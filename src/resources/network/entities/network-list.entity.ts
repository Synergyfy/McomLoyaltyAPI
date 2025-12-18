import { Entity, Column, ManyToMany, ManyToOne, JoinTable } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { Business } from '../../business/entities/business.entity';
import { Network } from './network.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum NetworkListType {
    B2B = 'B2B',
    B2C = 'B2C',
}

export enum NetworkListGeography {
    NEARBY = 'nearby',
    HYPERLOCAL = 'hyperlocal',
    NATIONAL = 'national',
    GLOBAL = 'global',
}

export enum NetworkListStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('network_lists')
export class NetworkList extends AbstractBaseEntity {
    @ApiProperty({ description: 'Name of the list' })
    @Column()
    name: string;

    @ApiProperty({ enum: NetworkListType, description: 'Type of the list (B2B/B2C)' })
    @Column({ type: 'enum', enum: NetworkListType })
    type: NetworkListType;

    @ApiProperty({ enum: NetworkListGeography, description: 'Geographical scope of the list' })
    @Column({ type: 'enum', enum: NetworkListGeography })
    geography: NetworkListGeography;

    @ApiProperty({ enum: NetworkListStatus, description: 'Status of the list', default: NetworkListStatus.ACTIVE })
    @Column({ type: 'enum', enum: NetworkListStatus, default: NetworkListStatus.ACTIVE })
    status: NetworkListStatus;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    business: Business;

    @ManyToMany(() => Network, (network) => network.networkLists)
    @JoinTable({
        name: 'network_list_members',
        joinColumn: { name: 'network_list_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'network_id', referencedColumnName: 'id' },
    })
    networks: Network[];
}
