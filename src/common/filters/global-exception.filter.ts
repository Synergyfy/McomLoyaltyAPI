import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse();

    const { message, code } =
      typeof exceptionResponse === "string"
        ? { message: exceptionResponse, code: null }
        : (exceptionResponse as any);

    response.status(status).json({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}
