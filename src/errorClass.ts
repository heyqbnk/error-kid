import { assignTag, createTag, hasTag } from './tag.js';

type ExtractConArgs<T extends ErrorClassOptions<any[], string>> =
  T extends { message: (...args: infer U) => any }
    ? U
      : T extends { cause: (...args: infer U) => any }
      ? U
    : [];

export interface ErrorClassInstance<Name extends string> extends Error {
  readonly name: Name;
  readonly $$errorKidTag: string;
}

export interface ErrorClass<ConArgs extends any[], Name extends string>
  extends Error {
  readonly name: Name;
  new(...args: ConArgs): ErrorClassInstance<Name>;
  /**
   * @returns True if the passed value is an instance of this class.
   * @param value - value to check.
   */
  is(value: unknown): value is ErrorClassInstance<Name>;
}

export interface ErrorClassOptions<ConArgs extends any[], Name extends string> {
  /**
   * Error class name.
   */
  name: Name;
  /**
   * A message error. This value will be passed to the super constructor (Error constructor).
   */
  message?: string | ((...args: ConArgs) => string);
  /**
   * An error cause. This value will be passed to the super constructor (Error constructor).
   */
  cause?: (...args: ConArgs) => unknown;
}

/**
 * @returns A new error class with a predefined name.
 */
export function errorClass<const Options extends ErrorClassOptions<any[], string>>(
  options: Options,
): ErrorClass<ExtractConArgs<Options>, Options['name']> {
  const tag = createTag(options.name);

  class CustomError extends Error {
    constructor(...args: ExtractConArgs<Options>) {
      super(
        typeof options.message === 'function'
          ? options.message(...args)
          : options.message,
        { cause: options.cause?.(...args) }
      );
      this.name = options.name;
      assignTag(this, tag);
      Object.setPrototypeOf(this, CustomError.prototype);
    }

    static is(value: unknown): value is ErrorClassInstance<Options['name']> {
      return hasTag(value, tag);
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
  return CustomError as unknown as ErrorClass<ExtractConArgs<Options>, Options['name']>;
}
