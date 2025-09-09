export function createIsInstanceOf<C extends { new(...args: any): any }>(
  Class: C,
): (value: unknown) => value is InstanceType<C> {
  return (value): value is InstanceType<C> => value instanceof Class;
}