import { it, expect, describe } from 'vitest';

import { errorClassWithData } from './errorClassWithData.js';

it('should create a class with specified name property', () => {
  const UnknownError = errorClassWithData<number>('UnknownError', () => 1);
  expect(UnknownError.name).toBe('UnknownError');
});

describe('instance', () => {
  describe('no super', () => {
    it('should have proper properties', () => {
      const AbortError = errorClassWithData<number, [string]>(
        'AbortError',
        Number,
      );

      const error = new AbortError('123');
      expect(error.data).toBe(123);
    });
  });

  describe('with super', () => {
    it('should have proper properties', () => {
      const AbortError = errorClassWithData<number, [string, unknown]>(
        'AbortError',
        Number,
        (code, cause) => [`Error code: ${code}`, { cause }],
      );

      const error = new AbortError('123', new Error('http'));
      expect(error.data).toBe(123);
      expect(error.message).toBe('Error code: 123');
      expect(error.cause).toStrictEqual(new Error('http'));
    });
  });
});

describe('is', () => {
  it('should return true if value is instance of created class', () => {
    const UnknownError = errorClassWithData('UnknownError', () => 1);

    class EnhancedUnknownError extends UnknownError {}

    expect(UnknownError.is(new UnknownError)).toBe(true);
    expect(UnknownError.is(new EnhancedUnknownError())).toBe(true);
    expect(UnknownError.is(123)).toBe(false);
    expect(UnknownError.is(new Error())).toBe(false);
  });
});