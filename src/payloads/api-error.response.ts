import { HttpStatus } from '@nestjs/common';
import { LiteCustomPrincipal } from './lite-custom.principle';

export class ApiErrorResponse {
  status: HttpStatus; // HTTP status code
  timestamp: Date; // Time when the error occurred
  message: string; // General error message
  errors: string[]; // List of specific error details
  path: string; // Request path where the error occurred
  user: LiteCustomPrincipal; // User details if available

  constructor(
    status: HttpStatus,
    timestamp: Date,
    message: string,
    errors: string[] | string,
    path: string,
    user: LiteCustomPrincipal,
  ) {
    this.status = status;
    this.timestamp = timestamp;
    this.message = message;
    this.errors = Array.isArray(errors) ? errors : [errors]; // Ensure errors is always an array
    this.path = path;
    this.user = user; // Retrieve user details as needed
  }
}
