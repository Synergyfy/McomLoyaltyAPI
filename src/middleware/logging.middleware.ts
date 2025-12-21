import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("Request");

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, ip } = req;
    const userAgent = req.get("user-agent") || "";

    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - ${userAgent} ${ip}`,
    );

    if (body && typeof body === "object" && Object.keys(body).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    next();
  }
}
