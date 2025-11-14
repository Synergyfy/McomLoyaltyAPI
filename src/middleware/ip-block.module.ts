import { Module } from '@nestjs/common';
import { IpBlockMiddleware } from './ip-block.middleware';
import { IpBlockModule } from '../resources/ip-block/ip-block.module';

@Module({
  imports: [IpBlockModule],
  providers: [IpBlockMiddleware],
  exports: [IpBlockMiddleware],
})
export class IpBlockMiddlewareModule {}
