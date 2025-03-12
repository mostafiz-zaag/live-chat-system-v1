// pipes/required-query.pipe.ts
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RequiredQueryPipe implements PipeTransform {
  constructor(private readonly parameterName: string) {}

  transform(value: any) {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${this.parameterName} is required`);
    }
    return value.trim();
  }
}
