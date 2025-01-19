import { it, expect, describe } from 'vitest';

import { errorClass } from './errorClass.js';

it('should create a class with specified name property', () => {
  const [UnknownError] = errorClass('UnknownError');
  expect(UnknownError.name).toBe('UnknownError');
});

describe('instance', () => {
  describe('no arguments', () => {
    it('should have proper name and message properties', () => {
      const [UnknownError] = errorClass('UnknownError');
      const error = new UnknownError();
      expect(error.name).toBe('UnknownError');
      expect(error.message).toBe('');
    });
  });

  it('should have proper properties', () => {
    const [UnknownError] = errorClass<
      [errorText: string, retriesCount: number, cause?: unknown]
    >('UnknownError', (errorText, retriesCount, cause) => {
      return [
        `Unknown error occurred. Retries count: ${retriesCount}. Error text: ${errorText}`,
        { cause },
      ];
    });
    const error = new UnknownError('Ooopsie!', 3, new Error('Just because'));
    expect(error.message).toBe('Unknown error occurred. Retries count: 3. Error text: Ooopsie!');
    expect(error.cause).toStrictEqual(new Error('Just because'));

    const [TimeoutError] = errorClass('TimeoutError', 'Timed out');

    const timeoutError = new TimeoutError();
    expect(timeoutError.message).toBe('Timed out');
  });

  it('should be instance of Error and its class', () => {
    const [UnknownError] = errorClass('UnknownError');
    expect(new UnknownError()).toBeInstanceOf(Error);
    expect(new UnknownError()).toBeInstanceOf(UnknownError);
  });
});

describe('predicate', () => {
  it('should return true if value is instance of created class', () => {
    const [UnknownError, is] = errorClass('UnknownError');
    expect(is(new UnknownError)).toBe(true);
    expect(is(123)).toBe(false);
  });
});