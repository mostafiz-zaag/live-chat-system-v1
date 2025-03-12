// src/common/exceptions/rate-limit.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a user exceeds the rate limit (HTTP 429).
 */
export class RateLimitException extends BaseException {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
