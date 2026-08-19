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

## Why

Declaring a custom error class in TypeScript involves more boilerplate than it should:

```ts
class TimeoutError extends Error {
  constructor(public readonly duration: number) {
    super(`Timed out: ${duration}ms`);
    // Not inherited from the class, must be assigned manually.
    this.name = 'TimeoutError';
    // Required to keep `instanceof` working when targeting ES5.
    // Easy to forget, and silently breaks error handling when omitted.
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
```

`error-kid` does all of it for you, and adds a typed `is` predicate along the way:

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData<
  { duration: number }, [duration: number]
>({
  name: 'TimeoutError',
  data: duration => ({ duration }),
  message: duration => `Timed out: ${duration}ms`,
}) {}
```

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

UnknownError.is(new Error); // false
UnknownError.is(error); // true
```

By default, created error class constructor accepts no arguments. It also passes nothing to
the `Error` super constructor.

> [!NOTE]
> Note that all examples in this document use the `class Err extends errorClass(...) {}` form
> instead of `const Err = errorClass(...)`. This is intentional. The function returns a value,
> so assigning it to a variable makes `Err` usable as a value only — using it as a type will
> not work. Declaring a class, in turn, creates both a value and a type with the same name:
>
> ```ts
> const ConstError = errorClass({ name: 'ConstError' });
> // Error: 'ConstError' refers to a value, but is being used as a type.
> function handle(error: ConstError) {}
>
> class ClassError extends errorClass({ name: 'ClassError' }) {}
> // Works as expected.
> function handle(error: ClassError) {}
> ```

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

### `is`

Each created class has a static `is` method — a type predicate checking if the passed value is
an instance of this class. Being a standalone function, it can be passed anywhere a predicate
is expected.

```ts
import { errorClass } from 'error-kid';

class TimeoutError extends errorClass({ name: 'TimeoutError' }) {}

try {
  // ...
} catch (error) {
  if (TimeoutError.is(error)) {
    // `error` is narrowed to TimeoutError here.
    error.message;
  }
}

// Narrowing works in predicate positions too.
const timeouts = errors.filter(TimeoutError.is);
```

> [!IMPORTANT]
> Prefer `is` over `instanceof`. When a class is declared via
> `class Err extends errorClass(...) {}`, `error instanceof Err` returns `false`, so `is` is
> the reliable way to check the error type.

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

> [!NOTE]
> Unlike `errorClass`, this function accepts the data type as its **first** generic parameter,
> and the constructor arguments tuple as the second one.

This function accepts the same `message` and `cause` options as the `errorClass` function, and
they behave exactly the same way.

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

The `is` predicate narrows the `data` property as well:

```ts
try {
  // ...
} catch (error) {
  if (TimeoutError.is(error)) {
    error.data.duration; // number
  }
}
```

## License

[MIT](LICENSE)
