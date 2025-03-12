// src/common/exceptions/file-storage.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a file storage operation fails (HTTP 500).
 */
export class FileStorageException extends BaseException {
  constructor(message: string = 'File storage error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
