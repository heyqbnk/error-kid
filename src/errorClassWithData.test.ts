import { it, expect, describe } from 'vitest';

import { errorClassWithData } from './errorClassWithData.js';

it('should create a class with specified name property', () => {
  const UnknownError = errorClassWithData<number>('UnknownError', () => 1);
  expect(UnknownError.name).toBe('UnknownError');
});

describe('instance', () => {
  // describe('no data and arguments', () => {
  //   it('should have proper name and message properties', () => {
  //     const UnknownError = createErrorClass('UnknownError');
  //     const error = new UnknownError();
  //     expect(error.name).toBe('UnknownError');
  //     expect(error.message).toBe('');
  //   });
  // });
  //
  // describe('no data', () => {
  //   it('should have proper properties', () => {
  //     const UnknownError = createErrorClass<
  //       // Error name.
  //       'UnknownError',
  //       // Constructor arguments.
  //       [errorText: string, retriesCount: number, cause?: unknown]
  //     >('UnknownError', {
  //       toSuper(errorText, retriesCount, cause) {
  //         // `Error` constructor requires the first argument
  //         // to be the error message. The second one is ErrorOptions,
  //         // containing the `cause` property.
  //         return [
  //           `Unknown error occurred. Retries count: ${retriesCount}. Error text: ${errorText}`,
  //           { cause },
  //         ];
  //       },
  //     });
  //     const error = new UnknownError('Ooopsie!', 3, new Error('Just because'));
  //     expect(error.message).toBe('Unknown error occurred. Retries count: 3. Error text: Ooopsie!');
  //     expect(error.cause).toStrictEqual(new Error('Just because'));
  //   });
  // });

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