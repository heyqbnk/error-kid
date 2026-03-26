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

## `errorClass`

A function used to create a new error class without custom data.

```ts
import { errorClass } from 'error-kid';

class UnknownError extends errorClass({ name: 'UnknownError' }) {}
UnknownError.name; // 'UnknownError'

const error = new UnknownError();
error.message; // ''
error.cause; // undefined
error instanceof Error; // true
error instanceof UnknownError; // true

UnknownError.is(new Error); // false
UnknownError.is(error); // true
```

By default, created error class constructor accepts no arguments. It also passes nothing to
the `Error` super constructor.

To change this behavior, define the arguments' type and provide a function to convert passed
arguments to the `Error` super constructor. It can also be a message presented as string, or
a tuple passed to the super constructor.

Here is the example:

```ts
import { errorClass } from 'error-kid';

// The generic parameter must be any tuple. It describes
// arguments passed to the error class constructor.
class ApiError extends errorClass<[
  errorText: string,
  retriesCount: number,
  cause?: unknown
]>({
  name: 'ApiError', 
  super(errorText, retriesCount, cause) {
    // `Error` constructor requires the first argument
    // to be the error message. The second one is ErrorOptions,
    // containing the `cause` property.
    return [
      `Request failed. Retries count: ${retriesCount}. Error text: ${errorText}`,
      { cause },
    ];
  }
}) {}

const error = new ApiError('Ooopsie!', 3, new Error('Just because'));
error.message; // "Request failed. Retries count: 3. Error text: Ooopsie!"
error.cause; // Error('Just because')

// All these definitions are ok:
const Err1 = errorClass({ name: 'Err1', super: 'Timed out' });
const Err2 = errorClass({ name: 'Err2', super: ['Timed out'] });
const Err3 = errorClass({ name: 'Err3', super: ['Timed out', new Error('Oops')] });
const Err4 = errorClass({ name: 'Err4', super: () => ['Timed out', new Error('Oops')] });
const Err5 = errorClass({ name: 'Err5', super: () => ['Timed out'] });
```

## `errorClassWithData`

A function that creates a new error class with typed data. It enhances the result
of calling the `errorClass` function.

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData<{ duration: number }, [duration: number]>({
  name: 'TimeoutError',
  data: duration => ({ duration }),
}) {}

const error = new TimeoutError(1000);
error.data; // { duration: 1000 }

TimeoutError.is(error); // true
```

As in the `errorClass` function, you can also pass a function to construct `Error`
arguments from the arguments, passed to the error constructor.

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData<
  { duration: number },
  [duration: number, cause?: unknown]
>({
  name: 'UnknownError',
  data: duration => ({ duration }),
  super: (duration, cause) => [`Timed out: ${duration}ms`, { cause }],
}) {}

const err1 = new TimeoutError(1000);
err1.data; // { duration: 1000 }
err1.message; // "Timed out: 1000ms"
err1.cause; // undefined

const err2 = new TimeoutError(1000, new Error('Just because'));
err2.data; // { duration: 1000 }
err2.message; // "Timed out: 1000ms"
err2.cause; // Error('Just because') 
```
