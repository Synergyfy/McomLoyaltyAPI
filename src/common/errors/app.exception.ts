import { HttpException, HttpStatus } from "@nestjs/common";

export class AppException extends HttpException {
  constructor(message: string, status: HttpStatus, code?: string) {
    super({ message, code }, status);
  }
}
