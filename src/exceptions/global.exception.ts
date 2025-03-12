import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from 'src/logging/logger.service';
import { ApiErrorResponse } from 'src/payloads/api-error.response';

/**
 * Custom Global Exception Filter to handle specific custom exceptions.
 */
@Catch()
export class CustomGlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly customLoggerService: CustomLoggerService) {}

  async catch(exception: any, host: ArgumentsHost) {
    // Switch to HTTP context
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default values
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Determine the status code and message based on exception type
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message from exception response
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || message;
      }
    } else if (exception instanceof Error) {
      // For non-HttpException errors
      message = exception.message;
    }

    // Construct the error response payload
    const apiErrorResponse = new ApiErrorResponse(
      statusCode,
      new Date(),
      Array.isArray(message) ? message[0] : message,
      message,
      request.url,
      await null,
    );

    // Log the error using CustomLoggerService
    this.customLoggerService.error(
      `Error occurred: [${new Date().toISOString()}] ${request.method} ${request.url} - ${message} - ${exception.stack}`,
    );

    // Send the error response
    response.status(statusCode).json(apiErrorResponse);
  }
}
