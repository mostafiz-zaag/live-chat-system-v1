import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class EnumValidationPipe implements PipeTransform {
  constructor(
    private readonly enumType: any,
    private readonly required: boolean = true,
  ) {}

  transform(value: any) {
    if (
      this.required &&
      (value === undefined || value === null || value === '')
    ) {
      throw new BadRequestException(`Value is required`);
    }

    // If value is not required and not provided, skip validation
    if (value === undefined || value === null || value === '') {
      return value;
    }

    const enumValues = Object.values(this.enumType);
    if (!enumValues.includes(value)) {
      throw new BadRequestException(
        `Invalid value: ${value}. Allowed values: ${enumValues.join(', ')}`,
      );
    }

    return value;
  }
}
