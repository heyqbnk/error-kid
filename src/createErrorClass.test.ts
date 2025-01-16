import { it, expect, describe } from 'vitest';

import { createErrorClass } from './createErrorClass.js';

it('should create a class with specified name property', () => {
  const UnknownError = createErrorClass('UnknownError');
  expect(UnknownError.name).toBe('UnknownError');
});

describe('instance', () => {
  describe('no data and arguments', () => {
    it('should have proper name and message properties', () => {
      const UnknownError = createErrorClass('UnknownError');
      const error = new UnknownError();
      expect(error.name).toBe('UnknownError');
      expect(error.message).toBe('');
    });
  });

  describe('no data', () => {
    it('should have proper properties', () => {
      const UnknownError = createErrorClass<
        // Error name.
        'UnknownError',
        // Constructor arguments.
        [errorText: string, retriesCount: number, cause?: unknown]
      >('UnknownError', {
        toSuper(errorText, retriesCount, cause) {
          // `Error` constructor requires the first argument
          // to be the error message. The second one is ErrorOptions,
          // containing the `cause` property.
          return [
            `Unknown error occurred. Retries count: ${retriesCount}. Error text: ${errorText}`,
            { cause },
          ];
        },
      });
      const error = new UnknownError('Ooopsie!', 3, new Error('Just because'));
      expect(error.message).toBe('Unknown error occurred. Retries count: 3. Error text: Ooopsie!');
      expect(error.cause).toStrictEqual(new Error('Just because'));
    });
  });

  describe('no arguments', () => {
    it('should have proper properties', () => {
      const AbortError = createErrorClass<
        'AbortError',
        { reason: unknown },
        [cause: unknown]
      >('AbortError', reason => ({ reason }));

      const error = new AbortError(new Error('Just because'));
      expect(error.data).toStrictEqual({ reason: new Error('Just because') });
    });
  });
});