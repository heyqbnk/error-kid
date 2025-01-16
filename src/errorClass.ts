export type ToSuperFn<ConstructorArgs extends any[]> =
  (...args: ConstructorArgs) => Parameters<ErrorConstructor>;

export interface CustomErrorClass<ConstructorArgs extends any[]> {
  new(...args: ConstructorArgs): Error;
}

/**
 * @return A new error class with a predefined name.
 * @param name - error class name
 * @param toSuper - function converting passed arguments to a list of arguments passed to
 * the `Error` constructor.
 */
export function errorClass<ConstructorArgs extends any[] = []>(
  name: string,
  toSuper?: ToSuperFn<ConstructorArgs>,
): CustomErrorClass<ConstructorArgs> {
  toSuper ||= (() => []);

  class CustomError extends Error {
    constructor(...args: ConstructorArgs) {
      super(...toSuper!(...args));
      this.name = name;
    }
  }

  Object.defineProperty(CustomError, 'name', { value: name });

  return CustomError;
}
