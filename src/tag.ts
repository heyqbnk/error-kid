/**
 * A name of the property storing the tag assigned to an error instance.
 *
 * A plain string key is used instead of a symbol intentionally. Symbols are dropped by
 * `JSON.stringify` and `structuredClone`, so a symbol-keyed mark would not survive an error
 * being serialized, sent through a network or a worker, and revived on the other side.
 */
export const TAG_KEY = '$$errorKidTag';

/**
 * @returns A tag for an error class with the specified name.
 * @param name - error class name.
 */
export function createTag<Name extends string>(name: Name) {
  return `${TAG_KEY}:${name}`;
}

/**
 * Assigns the specified tag to the error instance.
 *
 * A single tag is enough to support subclasses. A subclass inherits its parent constructor, so
 * an instance of it is tagged by the parent and recognized by the parent's `is` predicate.
 * @param target - error instance to tag.
 * @param tag - tag to assign.
 */
export function assignTag(target: object, tag: string): void {
  Object.defineProperty(target, TAG_KEY, {
    value: tag,
    // Enumerable, so the tag is included into JSON.stringify and structuredClone output and the
    // "is" predicate keeps working for a revived error.
    enumerable: true,
    // A class created by errorClassWithData assigns its tag on top of the one assigned by its
    // errorClass base, so the property must stay redefinable.
    writable: false,
    configurable: false,
  });
}

/**
 * @returns True if the value carries the specified tag.
 *
 * Note that this check is structural. A foreign object carrying the same tag will pass it. This
 * is a deliberate tradeoff: it makes the check work across realms, across duplicated copies of
 * this package, and for errors restored from their serialized form.
 * @param value - value to check.
 * @param tag - tag to look for.
 */
export function hasTag(value: unknown, tag: string): boolean {
  return (
    typeof value === 'object'
    && value !== null
    && (value as Partial<{ [TAG_KEY]: string }>)[TAG_KEY] === tag
  );
}
