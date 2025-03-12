// src/common/exceptions/missing-header.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when a required header is missing from the request (HTTP 400).
 */
export class MissingHeaderException extends BaseException {
  constructor(headerName: string = 'Required header') {
    super(`${headerName} is missing`, HttpStatus.BAD_REQUEST);
  }
}
