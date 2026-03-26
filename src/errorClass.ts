import { createErrorPredicate } from './createErrorPredicate.js';

export type ToSuperFn<ConstructorArgs extends any[]> =
  (...args: ConstructorArgs) => Parameters<ErrorConstructor>;

export type ToSuperType<ConstructorArgs extends any[]> =
  | ToSuperFn<ConstructorArgs>
  | string
  | Parameters<ErrorConstructor>;

export interface ErrorClass<ConstructorArgs extends any[]> {
  name: string;
  new(...args: ConstructorArgs): Error;
  /**
   * @returns True if the passed value is an instance of this class.
   * @param value - value to check.
   */
  is: (value: unknown) => value is Error;
}

/**
 * @returns A new error class with a predefined name.
 * @param name - error class name
 * @param super - a function converting passed constructor arguments to a list of arguments
 * passed to the `Error` constructor. It can also be a message or a list of arguments passed
 * to the super constructor.
 */
export function errorClass<ConstructorArgs extends any[] = []>(options: {
  name: string,
  super?: ToSuperType<ConstructorArgs>,
}): ErrorClass<ConstructorArgs> {
  class CustomError extends Error {
    constructor(...args: ConstructorArgs) {
      super(...(
        typeof options.super === 'function'
          ? options.super(...args)
          : typeof options.super === 'string'
            ? [options.super] satisfies [string]
            : options.super || []
      ));
      this.name = options.name;
      Object.setPrototypeOf(this, CustomError.prototype);
    }

    static is = createErrorPredicate(CustomError);
  }

  Object.defineProperty(CustomError, 'name', { value: options.name });

  return CustomError;
}
