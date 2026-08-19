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

export interface ErrorClassOptions<ConstructorArgs extends any[]> {
  /**
   * Error class name.
   */
  name: string,
  /**
   * A message error. This value will be passed to the super constructor (Error constructor).
   */
  message?: string | ((...args: ConstructorArgs) => string);
  /**
   * An error cause. This value will be passed to the super constructor (Error constructor).
   */
  cause?: (...args: ConstructorArgs) => unknown;
  /**
   * @deprecated Use `message` and `cause` options instead.
   */
  super?: ToSuperType<ConstructorArgs>,
}

/**
 * @returns A new error class with a predefined name.
 */
export function errorClass<ConstructorArgs extends any[] = []>(
  options: ErrorClassOptions<ConstructorArgs>,
): ErrorClass<ConstructorArgs> {
  if (options.super !== undefined) {
    const warnDubiosOption = (option: string) => {
      console.warn(`[error-kid] Error "${options.name}" is being created with both options.${option} and options.super specified. options.${option} will be ignored in favor of options.super. Consider replacing options.super with options.message and options.cause.`);
    };
    if (options.message !== undefined) {
      warnDubiosOption('message');
    }
    if (options.cause !== undefined) {
      warnDubiosOption('cause');
    }
  }

  const createConstructorArgs = (args: ConstructorArgs): [string?, ErrorOptions?] => {
    if (options.super !== undefined) {
      if (typeof options.super === 'function') {
        return options.super(...args);
      }
      if (typeof options.super === 'string') {
        return [options.super];
      }
      return options.super;
    }

    return [
      typeof options.message === 'function' ? options.message(...args) : options.message,
      { cause: options.cause?.(...args) }
    ];
  };

  class CustomError extends Error {
    constructor(...args: ConstructorArgs) {
      super(...createConstructorArgs(args));
      this.name = options.name;
      Object.setPrototypeOf(this, CustomError.prototype);
    }

    static is = createErrorPredicate(CustomError);
  }

  Object.defineProperty(CustomError, 'name', { value: options.name });

  return CustomError;
}
