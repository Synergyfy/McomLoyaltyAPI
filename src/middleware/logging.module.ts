import { Module } from '@nestjs/common';
import { LoggingMiddleware } from './logging.middleware';
import { RequestLogModule } from '../resources/request-log/request-log.module';

@Module({
  imports: [RequestLogModule],
  providers: [LoggingMiddleware],
  exports: [LoggingMiddleware],
})
export class LoggingModule {}
