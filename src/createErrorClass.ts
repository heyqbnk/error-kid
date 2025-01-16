export type ToDataFn<Data, ConstructorArgs extends any[]> = (...args: ConstructorArgs) => Data;

export interface CreateErrorClassOptions<ConstructorArgs extends any[]> {
  /**
   * Converts passed arguments to a list of arguments passed to the `Error` constructor.
   * @default Empty arguments list is passed.
   */
  toSuper?(...args: ConstructorArgs): Parameters<ErrorConstructor>;
}

export type CustomError<Name extends string, Data> =
  & Omit<Error, 'name'>
    & { name: Name }
    & ([Data] extends [never] ? {} : { data: Data });

export interface CustomErrorClass<Name extends string, Data, ConstructorArgs extends any[]> {
  name: Name;
  new(...args: ConstructorArgs): CustomError<Name, Data>;
}

/**
 * @returns A new error class with a predefined name.
 * @param name - error name
 * @param options - additional options
 */
export function createErrorClass<Name extends string, ConstructorArgs extends any[]>(
  name: Name,
  options?: CreateErrorClassOptions<ConstructorArgs>,
): CustomErrorClass<Name, never, ConstructorArgs>;

/**
 * @returns A new error class with a predefined name and data type.
 * @param name - error name
 * @param toData - function converting constructor arguments to data
 * @param options - additional options
 */
export function createErrorClass<
  Name extends string,
  Data,
  ConstructorArgs extends any[]
>(
  name: Name,
  toData: ToDataFn<Data, ConstructorArgs>,
  options?: CreateErrorClassOptions<ConstructorArgs>,
): CustomErrorClass<Name, Data, ConstructorArgs>;

export function createErrorClass(
  name: string,
  arg2?: ToDataFn<unknown, unknown[]> | CreateErrorClassOptions<unknown[]>,
  arg3?: CreateErrorClassOptions<unknown[]>,
): CustomErrorClass<string, never, unknown[]> {
  const options = typeof arg2 === 'object' ? arg2 : arg3 || {};
  const toData = typeof arg2 === 'function' && arg2;
  const toSuper = options.toSuper || (() => []);

  class CustomError extends Error {
    data: unknown;

    constructor(...args: unknown[]) {
      super(...toSuper(...args));
      this.name = name;
      toData && (this.data = toData(...args));
      Object.setPrototypeOf(this, CustomError.prototype);
    }
  }

  Object.defineProperty(CustomError, 'name', { value: name });

  return CustomError as CustomErrorClass<string, never, unknown[]>;
}
