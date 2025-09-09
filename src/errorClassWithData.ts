import { errorClass, type ToSuperType } from './errorClass.js';
import { createIsInstanceOf } from './createIsInstanceOf.js';

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
 * @param toData - function converting constructor arguments to data
 * @param toSuper - a function converting passed arguments to a list of arguments passed to
 * the `Error` constructor. It can also be a message or a list of arguments passed to the
 * super constructor.
 */
export function errorClassWithData<Data, ConstructorArgs extends any[] = []>(
  name: string,
  toData: ToDataFn<ConstructorArgs, Data>,
  toSuper?: ToSuperType<ConstructorArgs>,
): ErrorClassWithData<ConstructorArgs, Data> {
  class CustomError extends errorClass(name, toSuper) {
    readonly data: Data;

    constructor(...args: ConstructorArgs) {
      super(...args);
      this.data = toData(...args);
    }

    static is = createIsInstanceOf(CustomError);
  }

  Object.defineProperty(CustomError, 'name', { value: name });

  return CustomError;
}
