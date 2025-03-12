// src/common/exceptions/message-sending.exception.ts

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * Exception thrown when sending a message fails (HTTP 500).
 */
export class MessageSendingException extends BaseException {
  constructor(message: string = 'Failed to send message') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
