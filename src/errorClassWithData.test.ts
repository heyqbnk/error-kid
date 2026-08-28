import { it, expect, describe } from 'vitest';

import { errorClassWithData } from './errorClassWithData.js';

it('should create a class with specified name property', () => {
  const UnknownError = errorClassWithData({ name: 'UnknownError', data: () => 1 });
  expect(UnknownError.name).toBe('UnknownError');
});

it('should apply "message" option', () => {
  const Class1 = errorClassWithData({ name: 'Class1', message: 'Error message', data: () => ({}) });
  expect(new Class1().message).toBe('Error message');

  const Class2 = errorClassWithData({ name: 'Class2', message: () => 'Error message 2', data: () => ({}) });
  expect(new Class2().message).toBe('Error message 2');

  const Class3 = errorClassWithData({
    name: 'Class3',
    message: (errorNum: number) => `Error message ${errorNum}`,
    data: () => ({}),
  });
  expect(new Class3(3).message).toBe('Error message 3');
});

it('should apply "cause" option', () => {
  const Class1 = errorClassWithData({
    name: 'Class1',
    cause: () => 'Error cause',
    data: () => ({}),
  });
  expect(new Class1().cause).toBe('Error cause');
});

describe('instance', () => {
  it('should have proper properties', () => {
    const AbortError = errorClassWithData({ name: 'AbortError', data: Number });

    const error = new AbortError('123');
    expect(error.data).toBe(123);
  });
});

describe('is', () => {
  it('should return true if value is instance of created class', () => {
    const UnknownError = errorClassWithData({ name: 'UnknownError', data: () => 1 });

    class EnhancedUnknownError extends UnknownError { }

    expect(UnknownError.is(new UnknownError)).toBe(true);
    expect(UnknownError.is(new EnhancedUnknownError())).toBe(true);
    expect(UnknownError.is(123)).toBe(false);
    expect(UnknownError.is(new Error())).toBe(false);
  });

  it('should not confuse classes having different names', () => {
    const AError = errorClassWithData({ name: 'AError', data: () => 1 });
    const BError = errorClassWithData({ name: 'BError', data: () => 1 });

    expect(AError.is(new BError())).toBe(false);
    expect(BError.is(new AError())).toBe(false);
  });

  it('should work for an error restored from its serialized form', () => {
    const TimeoutError = errorClassWithData({
      name: 'TimeoutError',
      data: (duration: number) => ({ duration }),
    });

    const revived = JSON.parse(JSON.stringify(new TimeoutError(1000)));
    expect(revived instanceof TimeoutError).toBe(false);
    expect(TimeoutError.is(revived)).toBe(true);
    // The predicate narrows the value, so the data is reachable in a type-safe way.
    if (TimeoutError.is(revived)) {
      expect(revived.data).toStrictEqual({ duration: 1000 });
    }
  });
});
