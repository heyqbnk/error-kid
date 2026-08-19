import { errorClass, ErrorClassOptions, type ToSuperType } from './errorClass.js';
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

export interface ErrorClassWithDataOptions<Data, ConstructorArgs extends any[]>
  extends ErrorClassOptions<ConstructorArgs> {
  /**
   * A function converting constructor arguments to data
   */
  data: ToDataFn<ConstructorArgs, Data>,
}

/**
 * @returns A new error class with a predefined name and data type.
 */
export function errorClassWithData<Data, ConstructorArgs extends any[] = []>(
  options: ErrorClassWithDataOptions<Data, ConstructorArgs>
): ErrorClassWithData<ConstructorArgs, Data> {
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
