import { errorClass, type ToSuperType } from './errorClass.js';
import { createErrorPredicate } from './createErrorPredicate.js';

export type ToDataFn<ConstructorArgs extends any[], Data> = (...args: ConstructorArgs) => Data;

export interface ErrorWithData<Data> extends Error {
  readonly data: Data;
}

export interface ErrorClassWithData<ConstructorArgs extends any[], Data> {
  name: string;
  new(...args: ConstructorArgs): ErrorWithData<Data>;
  /**
   * @returns True if the passed value is an instance of this class.
   * @param value - value to check.
   */
  is: (value: unknown) => value is ErrorWithData<Data>;
}

/**
 * @returns A new error class with a predefined name and data type.
 * @param name - error name
 * @param data - function converting constructor arguments to data
 * @param super - a function converting passed arguments to a list of arguments passed to
 * the `Error` constructor. It can also be a message or a list of arguments passed to the
 * super constructor.
 */
export function errorClassWithData<Data, ConstructorArgs extends any[] = []>(options: {
  name: string,
  data: ToDataFn<ConstructorArgs, Data>,
  super?: ToSuperType<ConstructorArgs>,
}): ErrorClassWithData<ConstructorArgs, Data> {
  class CustomError extends errorClass(options) {
    readonly data: Data;

    constructor(...args: ConstructorArgs) {
      super(...args);
      this.data = options.data(...args);
      Object.setPrototypeOf(this, CustomError.prototype);
    }

    static is = createErrorPredicate(CustomError);
  }

  Object.defineProperty(CustomError, 'name', { value: options.name });

  return CustomError;
}
