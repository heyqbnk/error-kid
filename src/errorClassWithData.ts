import { errorClass, type ToSuperFn } from './errorClass.js';
import { isErrorOfKind, type IsErrorOfKindFn } from './isErrorOfKind.js';

export type ToDataFn<ConstructorArgs extends any[], Data> = (...args: ConstructorArgs) => Data;

export interface CustomErrorWithData<Data> extends Error {
  data: Data;
}

export interface ErrorClassWithData<Data, ConstructorArgs extends any[]> {
  name: string;
  new(...args: ConstructorArgs): CustomErrorWithData<Data>;
}

/**
 * @returns A new error class with a predefined name and data type.
 * @param name - error name
 * @param toData - function converting constructor arguments to data
 * @param toSuper - function converting passed arguments to a list of arguments passed to
 * the `Error` constructor.
 */
export function errorClassWithData<Data, ConstructorArgs extends any[] = []>(
  name: string,
  toData: ToDataFn<ConstructorArgs, Data>,
  toSuper?: ToSuperFn<ConstructorArgs>,
): [
  ErrorClass: ErrorClassWithData<Data, ConstructorArgs>,
  isInstanceOfErrorClass: IsErrorOfKindFn<CustomErrorWithData<Data>>,
] {
  class CustomError extends errorClass(name, toSuper)[0] {
    data: Data;

    constructor(...args: ConstructorArgs) {
      super(...args);
      this.data = toData(...args);
    }
  }

  Object.defineProperty(CustomError, 'name', { value: name });

  return [CustomError, isErrorOfKind(CustomError)];
}
