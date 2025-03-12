// src/common/exceptions/verification-failed.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when verification of data or credentials fails (HTTP 400).
 */
export class VerificationFailedException extends BaseException {
  constructor(message: string = 'Verification failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
