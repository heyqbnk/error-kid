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

A function returning a tuple, containing a new basic error class that has no payload on the first
place, and a predicate function on the second one.

```ts
import { errorClass } from 'error-kid';

const [UnknownError, isUnknownError] = errorClass('UnknownError');
UnknownError.name; // 'UnknownError'

const error = new UnknownError();
error.message; // ''
error.cause; // undefined
error instanceof Error; // true
error instanceof UnknownError; // true

isUnknownError(new Error); // false
isUnknownError(error); // true
```

By default, the created error class constructor accepts no arguments. It also passes nothing to
the `Error` super constructor.

To change this behavior, define the arguments' type and provide a function to convert passed
arguments to the `Error` super constructor. It can also be a message presented as string, or
a tuple passed to the super constructor.

Here is the example:

```ts
import { errorClass } from 'error-kid';

// The generic parameter must be any tuple. It describes
// arguments passed to the UnknownError constructor.
const [UnknownError] = errorClass<[
  errorText: string,
  retriesCount: number,
  cause?: unknown
]>('UnknownError', (errorText, retriesCount, cause) => {
  // `Error` constructor requires the first argument
  // to be the error message. The second one is ErrorOptions,
  // containing the `cause` property.
  return [
    `Unknown error occurred. Retries count: ${retriesCount}. Error text: ${errorText}`,
    { cause },
  ];
});

const error = new UnknownError('Ooopsie!', 3, new Error('Just because'));
error.message; // "Unknown error occurred. Retries count: 3. Error text: Ooopsie!"
error.cause; // Error('Just because')

// All these defines are ok:
const Err1 = errorClass('Err1', 'Timed out');
const Err2 = errorClass('Err2', ['Timed out']);
const Err3 = errorClass('Err3', ['Timed out', new Error('Oops')]);
const Err4 = errorClass('Err4', () => ['Timed out', new Error('Oops')]);
const Err5 = errorClass('Err5', () => ['Timed out']);
```

## `errorClassWithData`

A function that creates a new error class containing some payload. It enhances the result
of calling the `errorClass` function.

This function requires specifying at least one generic type parameter describing the error payload.
The second generic type parameter is optional (an empty tuple by default) and must be a tuple,
describing a list of arguments, passed to the error class constructor.

The second argument of the generator is a function, converting constructor arguments to the data.

```ts
import { errorClassWithData } from 'error-kid';


const [TimeoutError, isTimeoutError] =
  errorClassWithData<{ duration: number }, [duration: number]>(
    'UnknownError',
    duration => ({ duration }),
  );

const error = new TimeoutError(1000);
error.data; // { duration: 1000 }

isTimeoutError(error); // true
```

As in the `errorClass` function, you can also pass the third argument, which is a function,
transforming incoming arguments to the arguments, passed to the `Error` super constructor.

Let's enhance the previous example a bit:

```ts
import { errorClassWithData } from 'error-kid';

const [TimeoutError] = errorClassWithData<
  { duration: number },
  [duration: number, cause?: unknown]
>(
  'UnknownError',
  duration => ({ duration }),
  (duration, cause) => [`Timed out: ${duration}ms`, { cause }],
);

const err1 = new TimeoutError(1000);
err1.data; // { duration: 1000 }
err1.message; // "Timed out: 1000ms"
err1.cause; // undefined

const err2 = new TimeoutError(1000, new Error('Just because'));
err2.data; // { duration: 1000 }
err2.message; // "Timed out: 1000ms"
err2.cause; // Error('Just because') 
```