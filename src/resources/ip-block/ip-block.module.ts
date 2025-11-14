import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IpBlockService } from './ip-block.service';
import { BlockedIp } from './entities/ip-block.entity';
import { IpBlockController } from './ip-block.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedIp])],
  controllers: [IpBlockController],
  providers: [IpBlockService],
  exports: [IpBlockService],
})
export class IpBlockModule {}
