// src/common/exceptions/permission-denied.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a user lacks the necessary permissions (HTTP 403).
 */
export class PermissionDeniedException extends BaseException {
  constructor(message: string = 'Permission denied') {
    super(message, HttpStatus.FORBIDDEN);
  }
}
