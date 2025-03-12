import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsEnumWithMessageConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: any) {
    const enumValues = Object.values(args.constraints[0]);
    return enumValues.includes(value);
  }

  defaultMessage(args: any) {
    const enumValues = Object.values(args.constraints[0]);
    return `Invalid request type. Accepted values are: ${enumValues.join(', ')}`;
  }
}

export function IsEnumCustom(
  enumType: any,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [enumType],
      validator: IsEnumWithMessageConstraint,
    });
  };
}
