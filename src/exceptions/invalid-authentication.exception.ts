// src/common/exceptions/invalid-authentication.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when authentication fails (HTTP 401).
 */
export class InvalidAuthenticationException extends BaseException {
  constructor(message: string = 'Invalid authentication credentials') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
