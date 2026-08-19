import { it, expect, describe } from 'vitest';

import { errorClass } from './errorClass.js';

it('should create a class with specified name property', () => {
  const UnknownError = errorClass({ name: 'UnknownError' });
  expect(UnknownError.name).toBe('UnknownError');
});

it('should ignore message and cause options if super is specified', () => {
  const Class1 = errorClass({ name: 'Class1', super: ['1'], message: '2' });
  expect(new Class1().message).toBe('1');

  const Class2 = errorClass({ name: 'Class1', super: ['1', { cause: '2' }], cause: '3' });
  expect(new Class2().cause).toBe('2');
});

it('should apply "message" option', () => {
  const Class1 = errorClass({ name: 'Class1', message: 'Error message' });
  expect(new Class1().message).toBe('Error message');

  const Class2 = errorClass({ name: 'Class2', message: () => 'Error message 2' });
  expect(new Class2().message).toBe('Error message 2');

  const Class3 = errorClass<[errorNum: number]>({
    name: 'Class3',
    message: errorNum => `Error message ${errorNum}`
  });
  expect(new Class3(3).message).toBe('Error message 3');
});

it('should apply "cause" option', () => {
  const Class1 = errorClass({ name: 'Class1', cause: 'Error cause' });
  expect(new Class1().cause).toBe('Error cause');
});

describe('instance', () => {
  describe('no arguments', () => {
    it('should have proper name and message properties', () => {
      const UnknownError = errorClass({ name: 'UnknownError' });
      const error = new UnknownError();
      expect(error.name).toBe('UnknownError');
      expect(error.message).toBe('');
    });
  });

  it('should have proper properties', () => {
    const UnknownError = errorClass<
      [errorText: string, retriesCount: number, cause?: unknown]
    >({
      name: 'UnknownError',
      super(errorText, retriesCount, cause) {
        return [
          `Unknown error occurred. Retries count: ${retriesCount}. Error text: ${errorText}`,
          { cause },
        ];
      }
    });
    const error = new UnknownError('Ooopsie!', 3, new Error('Just because'));
    expect(error.message).toBe('Unknown error occurred. Retries count: 3. Error text: Ooopsie!');
    expect(error.cause).toStrictEqual(new Error('Just because'));

    const TimeoutError = errorClass({ name: 'TimeoutError', super: 'Timed out' });

    const timeoutError = new TimeoutError();
    expect(timeoutError.message).toBe('Timed out');
  });

  it('should be instance of Error and its class', () => {
    const UnknownError = errorClass({ name: 'UnknownError' });
    expect(new UnknownError()).toBeInstanceOf(Error);
    expect(new UnknownError()).toBeInstanceOf(UnknownError);
  });
});

describe('is', () => {
  it('should return true if value is instance of created class', () => {
    const UnknownError = errorClass({ name: 'UnknownError' });

    class EnhancedUnknownError extends UnknownError { }

    expect(UnknownError.is(new UnknownError)).toBe(true);
    expect(UnknownError.is(new EnhancedUnknownError())).toBe(true);
    expect(UnknownError.is(123)).toBe(false);
    expect(UnknownError.is(new Error())).toBe(false);
  });
});
