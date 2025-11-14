import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestLogService } from '../resources/request-log/request-log.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  constructor(private readonly requestLogService: RequestLogService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, ip } = req;
    const userAgent = req.get('user-agent') || '';

    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - ${userAgent} ${ip}`,
    );

    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    this.requestLogService
      .create({
        method,
        originalUrl,
        ip,
        userAgent,
      })
      .catch((err) => this.logger.error('Failed to save request log', err.stack));

    next();
  }
}
