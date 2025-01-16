# `error-kid`

[code-badge]: https://img.shields.io/badge/source-black?logo=github

[link]: https://github.com/heyqbnk/error-kid/tree/master

[npm-link]: https://npmjs.com/package/error-kid

[npm-badge]: https://img.shields.io/npm/v/error-kid?logo=npm

[size-badge]: https://img.shields.io/bundlephobia/minzip/error-kid

[![NPM][npm-badge]][npm-link]
![Size][size-badge]
[![code-badge]][link]

A simple toolkit to work with custom errors. **Definitely not a kid**.

## Installation

```bash
# yarn
yarn add error-kid

# pnpm
pnpm i error-kid

# npm
npm i error-kid
```

## `createErrorClass`

Creates a new error class with predefined name and data type.

```ts
import { createErrorClass } from 'error-kid';

const UnknownError = createErrorClass('UnknownError');
UnknownError.name; // 'UnknownError'
```

By default, the created error class constructor accepts no arguments. It also passes nothing
to the `Error` super constructor.

To change this behavior, define the arguments' type and provide the `toSuper` options function
converting passed arguments to the `Error` super constructor.

Here is the example:

```ts
import { createErrorClass } from 'error-kid';

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
error.message; // "Unknown error occurred. Retries count: 3. Error text: Ooopsie!"
error.cause; // Error('Just because')
```

If the custom error class must contain some additional data, consider using the second
generic argument and provide the `toData` function converting constructor arguments to the 
defined type.

```ts
import { createErrorClass } from 'error-kid';

const TimeoutError = createErrorClass<
  'TimeoutError',
  { duration: number },
  [duration: number]
>('UnknownError', duration => ({ duration }), {
  toSuper(duration) {
    return [`Timed out: ${duration}ms`];
  },
});

const error = new TimeoutError(1000);
error.data; // { duration: 1000 }
error.message; // "Timed out: 1000ms"

// Or even without the third argument:
const AbortError = createErrorClass<
  'AbortError',
  { reason: unknown },
  [cause: unknown]
>('AbortError', cause => ({ reason: cause }));

const error2 = new AbortError(new Error('Just because'));
error2.data; // { reason: Error('Just because') }
```