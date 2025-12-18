import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworkService } from './network.service';
import { NetworkController } from './network.controller';
import { Network } from './entities/network.entity';
import { NetworkList } from './entities/network-list.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Network, NetworkList])],
    controllers: [NetworkController],
    providers: [NetworkService],
})
export class NetworkModule { }
