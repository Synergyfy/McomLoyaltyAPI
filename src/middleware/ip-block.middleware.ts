import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IpBlockService } from '../resources/ip-block/ip-block.service';

@Injectable()
export class IpBlockMiddleware implements NestMiddleware {
  constructor(private readonly ipBlockService: IpBlockService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const isBlocked = await this.ipBlockService.findOne(ip);

    if (isBlocked) {
      throw new ForbiddenException('This IP address has been blocked.');
    }

    next();
  }
}
