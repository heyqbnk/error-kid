import { isErrorOfKind, type IsErrorOfKindFn } from './isErrorOfKind.js';

export type ToSuperFn<ConstructorArgs extends any[]> =
  (...args: ConstructorArgs) => Parameters<ErrorConstructor>;

export type ToSuperType<ConstructorArgs extends any[]> =
  | ToSuperFn<ConstructorArgs>
  | string
  | Parameters<ErrorConstructor>;

export interface CustomErrorWithoutData extends Error {
  type: symbol;
}

export interface ErrorClass<ConstructorArgs extends any[]> {
  name: string;
  new(...args: ConstructorArgs): CustomErrorWithoutData;
}

/**
 * @return A new error class with a predefined name.
 * @param name - error class name
 * @param toSuper - a function converting passed arguments to a list of arguments passed to
 * the `Error` constructor. It can also be a message or a list of arguments passed to the
 * super constructor.
 */
export function errorClass<ConstructorArgs extends any[] = []>(
  name: string,
  toSuper?: ToSuperType<ConstructorArgs>,
): [
  ErrorClass: ErrorClass<ConstructorArgs>,
  isInstanceOfErrorClass: IsErrorOfKindFn<InstanceType<ErrorClass<ConstructorArgs>>>,
] {
  toSuper ||= [];
  const type = Symbol(name);

  class CustomError extends Error implements CustomErrorWithoutData {
    type = type;

    constructor(...args: ConstructorArgs) {
      const params = typeof toSuper === 'function'
        ? toSuper(...args)
        : typeof toSuper === 'string'
          ? [toSuper] as [string]
          : toSuper || [];
      super(...params);
      this.name = name;
    }
  }

  Object.defineProperty(CustomError, 'name', { value: name });

  return [CustomError, isErrorOfKind(CustomError, type)];
}
