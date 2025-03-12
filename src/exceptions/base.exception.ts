import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all custom exceptions.
 * Extends NestJS's HttpException to include a default message and status code.
 */
export class BaseException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(message, status);
  }
}
