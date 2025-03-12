import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { stringToBigint } from '../../utils/project.util';

export function IsBigIntPositive(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isBigIntPositive',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return stringToBigint(value) > BigInt(0);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should be a positive integer.`;
        },
      },
    });
  };
}
