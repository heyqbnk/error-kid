import { it, expect, describe } from 'vitest';

import { errorClass } from './errorClass.js';
import { matchError } from './matchError.js';

const TimeoutError = errorClass({ name: 'TimeoutError', message: (n: string) => n });
const ApiError = errorClass({ name: 'ApiError', message: (a: number) => a.toString() });

type TimeoutError = InstanceType<typeof TimeoutError>;
type ApiError = InstanceType<typeof ApiError>;

it('should call the handler matching the error name', () => {
  const handlers = {
    TimeoutError: (e: TimeoutError) => `T:${e.message}`,
    ApiError: (e: ApiError) => `A:${e.message}`,
  };

  expect(matchError(new TimeoutError('timed out') as TimeoutError | ApiError, handlers))
    .toBe('T:timed out');
  expect(matchError(new ApiError(500) as TimeoutError | ApiError, handlers))
    .toBe('A:500');
});

it('should pass the error itself to the handler', () => {
  const error = new TimeoutError('oops');
  expect(matchError(error as TimeoutError | ApiError, {
    TimeoutError: e => e,
    ApiError: e => e,
  })).toBe(error);
});

it('should throw if no handler matched and the "loose" option is disabled', () => {
  expect(() => {
    matchError('not an error' as any, { TimeoutError: (e: TimeoutError) => 1 } as any);
  }).toThrow(TypeError);
});

describe('loose', () => {
  it('should route non-library values to the "default" handler', () => {
    const handlers = {
      TimeoutError: (e: TimeoutError) => 'T',
      ApiError: (e: ApiError) => 'A',
      default: (v: string | number) => `D:${v}`,
    };
    type Value = TimeoutError | ApiError | string | number;

    expect(matchError('hey' as Value, handlers, { loose: true })).toBe('D:hey');
    expect(matchError(42 as Value, handlers, { loose: true })).toBe('D:42');
  });

  it('should still prefer an error handler over the "default" one', () => {
    expect(matchError(new ApiError(404) as TimeoutError | ApiError | string, {
      TimeoutError: e => 'T',
      ApiError: e => 'A',
      default: v => 'D',
    }, { loose: true })).toBe('A');
  });

  it('should route a foreign value carrying a matching name to the "default" handler', () => {
    // The tag is what identifies a library error, not the name alone.
    expect(matchError({ name: 'TimeoutError' } as any, {
      TimeoutError: (e: TimeoutError) => 'T',
      ApiError: (e: ApiError) => 'A',
      default: (v: unknown) => 'D',
    } as any, { loose: true })).toBe('D');
  });

  it('should allow an optional argumentless "default" when there is nothing to pass to it', () => {
    // Every value of the matched type is a library error, so "default" is unreachable.
    expect(matchError(new ApiError(1) as TimeoutError | ApiError, {
      TimeoutError: () => 'T',
      ApiError: () => 'A',
      default: () => 'D',
    }, { loose: true })).toBe('A');

    expect(matchError(new ApiError(1) as TimeoutError | ApiError, {
      TimeoutError: () => 'T',
      ApiError: () => 'A',
    }, { loose: true })).toBe('A');
  });

  it('should route an error restored from its serialized form to its handler', () => {
    const revived = JSON.parse(JSON.stringify(new TimeoutError('revived')));
    expect(matchError(revived, {
      TimeoutError: (e: TimeoutError) => 'T',
      ApiError: (e: ApiError) => 'A',
      default: (v: unknown) => 'D',
    } as any, { loose: true })).toBe('T');
  });
});
