// src/common/exceptions/bad-gateway.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a bad gateway error occurs (HTTP 502).
 */
export class BadGatewayException extends BaseException {
  constructor(message: string = 'Bad Gateway') {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}
