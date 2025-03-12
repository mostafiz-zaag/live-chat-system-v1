import { ApiProperty } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import 'reflect-metadata';

type Constructor<T = any> = new (...args: any[]) => T;

export function AutoApiPropertyClass<T>(target: Constructor<T>) {
  const properties = Object.getOwnPropertyNames(target.prototype);

  // Iterate over each property in the class prototype (excluding constructor)
  properties.forEach((property) => {
    if (property !== 'constructor') {
      // Check if the property has any existing decorators
      const existingDecorator = Reflect.getMetadata(
        'swagger/apiModelProperties',
        target.prototype,
        property,
      );

      // If no @ApiProperty is already applied, add it
      if (!existingDecorator) {
        const descriptor = Object.getOwnPropertyDescriptor(
          target.prototype,
          property,
        );
        if (descriptor && !descriptor.value) {
          // Apply @ApiProperty dynamically
          applyDecorators(ApiProperty());
        }
      }
    }
  });
}
