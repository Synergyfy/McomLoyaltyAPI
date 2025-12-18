import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupCircleService } from './group-circle.service';
import { GroupCircleController } from './group-circle.controller';
import { GroupCircle } from './entities/group-circle.entity';
import { GroupCircleMember } from './entities/group-circle-member.entity';
import { GroupMessage } from './entities/group-message.entity';
import { GroupActivity } from './entities/group-activity.entity';
import { NetworkList } from '../network/entities/network-list.entity';
import { Network } from '../network/entities/network.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            GroupCircle,
            GroupCircleMember,
            GroupMessage,
            GroupActivity,
            NetworkList,
            Network
        ])
    ],
    controllers: [GroupCircleController],
    providers: [GroupCircleService],
})
export class GroupCircleModule {}
