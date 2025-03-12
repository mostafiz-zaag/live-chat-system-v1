// src/common/exceptions/resource-already-exist.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when attempting to create a resource that already exists (HTTP 409).
 */
export class ResourceAlreadyExistException extends BaseException {
  constructor(message: string = 'Resource already exists') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
