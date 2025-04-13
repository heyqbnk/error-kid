export type IsErrorOfKindFn<Err> = (value: unknown) => value is Err;

/**
 * Creates a predicate function returning true if the passed value is an instance of the
 * specified class.
 * @param ErrorClass
 * @param type
 */
export function isErrorOfKind<Err extends { type: symbol }>(
  ErrorClass: { new(...args: any[]): Err },
  type: symbol,
): IsErrorOfKindFn<Err> {
  return (value): value is Err => {
    return value instanceof ErrorClass && value.type === type;
  };
}