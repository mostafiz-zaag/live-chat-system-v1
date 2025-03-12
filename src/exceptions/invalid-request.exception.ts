// src/common/exceptions/invalid-request.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a request is invalid or malformed (HTTP 400).
 */
export class InvalidRequestException extends BaseException {
  constructor(message: string = 'Invalid request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
