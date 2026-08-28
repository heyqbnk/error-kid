import type { ErrorClassInstance } from './errorClass.js';
import { TAG_KEY } from './tag.js';

/**
 * Extracts library errors from the passed value type.
 */
type LibraryErrors<T> = Extract<T, ErrorClassInstance<string>>;

/**
 * Extracts everything but library errors from the passed value type.
 */
type NonLibraryValues<T> = Exclude<T, ErrorClassInstance<string>>;

/**
 * @returns A library error with the specified name.
 */
type ErrorByName<T, Name extends string> = Extract<LibraryErrors<T>, { name: Name }>;

/**
 * Handlers for each library error present in the passed value type, keyed by the error name.
 */
export type MatchErrorHandlers<T> = {
  [TError in LibraryErrors<T> as TError['name']]: (error: TError) => any;
};

/**
 * The "default" handler. It is only allowed when the "loose" option is enabled, in which case it
 * becomes required and receives every value that is not a library error.
 *
 * When the value type consists of library errors only, there is nothing left for this handler to
 * receive. It stays allowed, but becomes optional and accepts no arguments: requiring a handler
 * whose only valid parameter type is "never" would make the call impossible to write.
 */
// The tuples prevent the conditionals from distributing. Omitting the options argument infers the
// option type as "boolean | undefined", and a distributing conditional would then produce a union
// including the "loose: true" branch, allowing "default" to be passed with the option disabled.
export type MatchErrorDefaultHandler<T, Loose extends boolean | undefined> = [Loose] extends [true]
  ? [NonLibraryValues<T>] extends [never]
    ? { default?: () => any }
    : { default: (value: NonLibraryValues<T>) => any }
  // Optional "never" instead of an empty object: it forbids passing "default" when the "loose"
  // option is disabled, instead of silently ignoring it.
  : { default?: never };

export type MatchErrorHandlersWithDefault<T, Loose extends boolean | undefined> =
  MatchErrorHandlers<T> & MatchErrorDefaultHandler<T, Loose>;

/**
 * Forbids a handler from widening its parameter.
 *
 * The plain handlers type only requires a handler to be assignable, and parameters are compared
 * contravariantly, so a handler accepting a supertype (the whole union, Error, unknown) would
 * pass. Testing the parameter in the opposite direction rejects it. The tuples prevent the
 * conditional type from distributing, so a union parameter is checked as a whole.
 *
 * The "default" handler is checked the same way against the non-library values.
 */
export type ExactMatchErrorHandlers<T, THandlers> = {
  [K in keyof THandlers]: THandlers[K] extends (...args: infer Params) => any
    // A handler is free to ignore its argument, so an empty parameter list is always accepted.
    ? [Params] extends [[]]
      ? THandlers[K]
        : [Params] extends [
          [K extends 'default' ? NonLibraryValues<T> : ErrorByName<T, K & string>]
        ]
        ? THandlers[K]
      : never
    : never;
};

export type MatchErrorHandlersResult<THandlers> = {
  [K in keyof THandlers]: THandlers[K] extends (...args: any) => infer R ? R : never;
}[keyof THandlers];

export interface MatchErrorOptions {
  /**
   * Allows passing a "default" handler receiving every value that is not a library error.
   *
   * Enabling this option makes the "default" handler required, unless the value type consists of
   * library errors only. In that case the handler receives no arguments and stays optional.
   * @default false
   */
  loose?: boolean;
}

/**
 * Calls the handler matching the passed error name.
 *
 * All library errors present in the value type must be handled. Enabling the "loose" option adds
 * a required "default" handler receiving everything else.
 * @returns The matched handler result.
 * @param value - value to match.
 * @param handlers - handlers for each library error, and "default" if the "loose" option is on.
 * @param options - matching options.
 * @throws {TypeError} No handler matched the passed value.
 */
export function matchError<
  TValue,
  const TOptions extends MatchErrorOptions,
  THandlers extends
    & MatchErrorHandlersWithDefault<TValue, TOptions['loose']>
    & ExactMatchErrorHandlers<TValue, THandlers>,
>(
  value: TValue,
  handlers: THandlers,
  options?: TOptions,
): MatchErrorHandlersResult<THandlers> {
  const record = handlers as Record<string, ((value: unknown) => unknown) | undefined>;

  // The tag presence is checked instead of the name alone, so a foreign value carrying a matching
  // "name" property is routed to the "default" handler rather than to an error one.
  if (typeof value === 'object' && value !== null && TAG_KEY in value) {
    const handler = record[(value as unknown as ErrorClassInstance<string>).name];
    if (handler) {
      return handler(value) as MatchErrorHandlersResult<THandlers>;
    }
  }

  if (options?.loose) {
    return record.default!(value) as MatchErrorHandlersResult<THandlers>;
  }

  throw new TypeError('matchError: no handler matched the passed value');
}
