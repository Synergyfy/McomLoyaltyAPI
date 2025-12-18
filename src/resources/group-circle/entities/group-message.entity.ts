import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/base.entity';
import { GroupCircle } from './group-circle.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('group_messages')
export class GroupMessage extends AbstractBaseEntity {
    @ApiProperty()
    @Column()
    content: string;

    @ManyToOne(() => GroupCircle, { onDelete: 'CASCADE' })
    groupCircle: GroupCircle;

    @ApiProperty()
    @Column()
    senderName: string;

    @ApiProperty()
    @Column()
    senderId: string; // UUID of Business or Network Member
}
