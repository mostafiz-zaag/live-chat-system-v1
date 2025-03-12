import { BadRequestException } from '@nestjs/common';

export function ensureDefined(value: any, paramName: string): void {
  if (value === undefined || value === null) {
    throw new BadRequestException(`${paramName} must not be null or undefined`);
  }
}
