export type IsErrorOfKindFn<Err> = (value: unknown) => value is Err;

/**
 * Creates a predicate function returning true if the passed value is an instance of the
 * specified class.
 * @param ErrorClass
 */
export function isErrorOfKind<Err>(
  ErrorClass: { new(...args: any[]): Err }
): IsErrorOfKindFn<Err> {
  return (value): value is Err => value instanceof ErrorClass;
}