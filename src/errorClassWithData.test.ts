import { it, expect, describe } from 'vitest';

import { errorClassWithData } from './errorClassWithData.js';

it('should create a class with specified name property', () => {
  const UnknownError = errorClassWithData<number>({ name: 'UnknownError', data: () => 1 });
  expect(UnknownError.name).toBe('UnknownError');
});

it('should ignore message and cause options if super is specified', () => {
  const Class1 = errorClassWithData<{}>({
    name: 'Class1',
    super: ['1'],
    message: '2',
    data: () => ({})
  });
  expect(new Class1().message).toBe('1');

  const Class2 = errorClassWithData<{}>({
    name: 'Class1',
    super: ['1', { cause: '2' }],
    cause: '3',
    data: () => ({})
  });
  expect(new Class2().cause).toBe('2');
});

it('should apply "message" option', () => {
  const Class1 = errorClassWithData<{}>({ name: 'Class1', message: 'Error message', data: () => ({}) });
  expect(new Class1().message).toBe('Error message');

  const Class2 = errorClassWithData<{}>({ name: 'Class2', message: () => 'Error message 2', data: () => ({}) });
  expect(new Class2().message).toBe('Error message 2');

  const Class3 = errorClassWithData<{}, [errorNum: number]>({
    name: 'Class3',
    message: errorNum => `Error message ${errorNum}`,
    data: () => ({}),
  });
  expect(new Class3(3).message).toBe('Error message 3');
});

it('should apply "cause" option', () => {
  const Class1 = errorClassWithData<{}>({ name: 'Class1', cause: 'Error cause', data: () => ({}) });
  expect(new Class1().cause).toBe('Error cause');
});

describe('instance', () => {
  describe('no super', () => {
    it('should have proper properties', () => {
      const AbortError = errorClassWithData<number, [string]>({ name: 'AbortError', data: Number });

      const error = new AbortError('123');
      expect(error.data).toBe(123);
    });
  });

  describe('with super', () => {
    it('should have proper properties', () => {
      const AbortError = errorClassWithData<number, [string, unknown]>({
        name: 'AbortError',
        data: Number,
        super: (code, cause) => [`Error code: ${code}`, { cause }],
      });

      const error = new AbortError('123', new Error('http'));
      expect(error.data).toBe(123);
      expect(error.message).toBe('Error code: 123');
      expect(error.cause).toStrictEqual(new Error('http'));
    });
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
});
