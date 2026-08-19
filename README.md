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

### `message`

To specify the error message, use the `message` option. It accepts either a static string, or
a function computing the message from the constructor arguments.

```ts
import { errorClass } from 'error-kid';

const TimeoutError = errorClass({ name: 'TimeoutError', message: 'Timed out' });
new TimeoutError().message; // 'Timed out'
```

To compute the message dynamically, define the constructor arguments' type using the generic
parameter. It must be any tuple, and it describes arguments passed to the error class
constructor.

```ts
import { errorClass } from 'error-kid';

class ApiError extends errorClass<[
  errorText: string,
  retriesCount: number,
]>({
  name: 'ApiError',
  message: (errorText, retriesCount) => {
    return `Request failed. Retries count: ${retriesCount}. Error text: ${errorText}`;
  },
}) {}

const error = new ApiError('Ooopsie!', 3);
error.message; // "Request failed. Retries count: 3. Error text: Ooopsie!"
```

### `cause`

The `cause` option specifies the error cause. It is passed to the `Error` super constructor as
the `cause` property of `ErrorOptions`.

```ts
import { errorClass } from 'error-kid';

const DatabaseError = errorClass({
  name: 'DatabaseError',
  message: 'Failed to connect',
  cause: new Error('ECONNREFUSED'),
});

const error = new DatabaseError();
error.message; // 'Failed to connect'
error.cause; // Error('ECONNREFUSED')
```

### `super` (deprecated)

> [!WARNING]
> The `super` option is deprecated. Use the `message` and `cause` options instead.

The `super` option is a function converting passed constructor arguments to the list of
arguments passed to the `Error` super constructor. It can also be a message presented as a
string, or a tuple passed to the super constructor.

```ts
import { errorClass } from 'error-kid';

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

When `super` is specified, it takes precedence: the `message` and `cause` options are ignored,
and a warning is printed to the console.

```ts
import { errorClass } from 'error-kid';

// Prints a warning. The `message` option is ignored.
const Err = errorClass({ name: 'Err', super: ['Timed out'], message: 'Ignored' });
new Err().message; // 'Timed out'
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

This function accepts the same `message`, `cause` and `super` options as the `errorClass`
function, and they behave exactly the same way.

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData<
  { duration: number },
  [duration: number]
>({
  name: 'TimeoutError',
  data: duration => ({ duration }),
  message: duration => `Timed out: ${duration}ms`,
  cause: new Error('Just because'),
}) {}

const error = new TimeoutError(1000);
error.data; // { duration: 1000 }
error.message; // "Timed out: 1000ms"
error.cause; // Error('Just because')
```

Using the deprecated `super` option:

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData<
  { duration: number },
  [duration: number, cause?: unknown]
>({
  name: 'TimeoutError',
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
