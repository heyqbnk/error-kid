import { errorClass, ErrorClassInstance, type ErrorClassOptions } from './errorClass.js';

type ExtractConArgs<T extends ErrorClassOptions<any[], string>> =
  T extends { message: (...args: infer U) => any }
    ? U
    : T extends { cause: (...args: infer U) => any }
      ? U
      : T extends { data: (...args: infer U) => any }
        ? U
        : [];

type ExtractData<T extends ErrorClassWithDataOptions<any, any[], string>> =
  T extends { data: (...args: infer U) => any }
  ? U
  : never;

export interface ErrorClassWithDataInstance<Data, Name extends string>
  extends ErrorClassInstance<Name> {
  readonly data: Data;
}

export interface ErrorClassWithData<ConArgs extends any[], Data, Name extends string> {
  readonly name: Name;
  new(...args: ConArgs): ErrorClassWithDataInstance<Data, Name>;
  /**
   * @returns True if the passed value is an instance of this class.
   * @param value - value to check.
   */
  is(value: unknown): value is ErrorClassWithDataInstance<Data, Name>;
}

export interface ErrorClassWithDataOptions<Data, ConArgs extends any[], Name extends string>
  extends ErrorClassOptions<ConArgs, Name> {
  /**
   * A function converting constructor arguments to data
   */
  data(...args: ConArgs): Data,
}

/**
 * @returns A new error class with a predefined name and data type.
 */
export function errorClassWithData<
  const Options extends ErrorClassWithDataOptions<any, any[], any>,
>(
  options: Options
): ErrorClassWithData<ExtractConArgs<Options>, ExtractData<Options>, Options['name']> {
  class CustomError extends errorClass(options) {
    readonly data: ExtractData<Options>;

    constructor(...args: ExtractConArgs<Options>) {
      // Its ok. errorClass function doesn't see 
      super(...args as any);
      this.data = options.data(...args);
      Object.setPrototypeOf(this, CustomError.prototype);
    }
  }

  Object.defineProperty(CustomError, 'name', {
    value: options.name,
    configurable: true,
    writable: false,
    enumerable: true,
  });

  // The cast is required because Object.defineProperty is invisible to the type system: it cannot
  // narrow the static "name" from string to Name, nor the tag to its template literal type.
  return CustomError as unknown as ErrorClassWithData<ExtractConArgs<Options>, ExtractData<Options>, Options['name']>;
}
