import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HelpRequestsService } from './help-requests.service';
import { HelpRequestsController } from './help-requests.controller';
import { HelpRequest } from './entities/help-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HelpRequest]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [HelpRequestsController],
  providers: [HelpRequestsService],
})
export class HelpRequestsModule {}
