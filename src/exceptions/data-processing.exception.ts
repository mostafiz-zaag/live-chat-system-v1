// src/common/exceptions/data-processing.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when an error occurs during data processing (HTTP 500).
 */
export class DataProcessingException extends BaseException {
  constructor(message: string = 'Error processing data') {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
