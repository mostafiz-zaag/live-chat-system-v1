// src/common/exceptions/resource-not-found.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a requested resource is not found (HTTP 404).
 */
export class ResourceNotFoundException extends BaseException {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}
