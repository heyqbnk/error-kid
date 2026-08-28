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

const err = new TimeoutError(1000);
if (err instanceof TimeoutError) {
  // err is TimeoutError
}
```

`error-kid` does all of it for you, and adds a typed `is` predicate along the way:

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData({
  name: 'TimeoutError',
  data: (duration: number) => ({ duration }),
  message: (duration: number) => `Timed out: ${duration}ms`,
}) {}

const err = new TimeoutError(1000);
if (TimeoutError.is(err)) {
  // err is TimeoutError
}
```

It also ships [`matchError`](#matcherror) — an exhaustive, type-checked way to branch on an error
union instead of writing a chain of `if (X.is(error))`.

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

To compute the message dynamically, pass a function. Its parameters define the constructor
arguments — they are inferred, so annotate them directly instead of passing a generic tuple.

```ts
import { errorClass } from 'error-kid';

class ApiError extends errorClass({
  name: 'ApiError',
  message: (errorText: string, retriesCount: number) => {
    return `Request failed. Retries count: ${retriesCount}. Error text: ${errorText}`;
  },
}) {}

const error = new ApiError('Ooopsie!', 3);
error.message; // "Request failed. Retries count: 3. Error text: Ooopsie!"
```

> [!IMPORTANT]
> Constructor arguments are taken from exactly one option, in this order: `message`, then `cause`,
> then `data`. The first one declared as a function wins, and the rest must accept the same
> arguments. So when `message` is a function, it is the one defining the signature — a `cause`
> expecting different arguments will not extend it.

### `cause`

The `cause` option is a function computing the error cause from the constructor arguments. Its
returned value is passed to the `Error` super constructor as the `cause` property of
`ErrorOptions`.

Most commonly the cause is one of the constructor arguments:

```ts
import { errorClass } from 'error-kid';

class ApiError extends errorClass({
  name: 'ApiError',
  message: (status: number, cause?: unknown) => `Request failed with status ${status}`,
  cause: (_status: number, cause?: unknown) => cause,
}) {}

const error = new ApiError(500, new Error('ECONNRESET'));
error.message; // 'Request failed with status 500'
error.cause; // Error('ECONNRESET')
```

Since `message` is a function here, it defines the constructor arguments, and `cause` repeats the
same signature to access the second one.

To use a constant cause, return it from a function accepting no arguments:

```ts
import { errorClass } from 'error-kid';

class DatabaseError extends errorClass({
  name: 'DatabaseError',
  message: 'Failed to connect',
  cause: () => new Error('ECONNREFUSED'),
}) {}

new DatabaseError().cause; // Error('ECONNREFUSED')
```

When the option is omitted, `cause` is `undefined`.

### `is`

Each created class has a static `is` method — a type predicate checking if the passed value is
an instance of this class. Being a standalone function, it can be passed anywhere a predicate
is expected.

Instead of using `instanceof`, `is` checks a tag stored on the error instance. See
[How `is` works](#how-is-works) for the details and the tradeoff.

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

### How `is` works

`is` does not use `instanceof`. Every instance receives a `$$errorKidTag` property equal to
`$$errorKidTag:{name}`, and `is` checks that property.

`instanceof` compares constructor identity, which silently fails in several common situations:

- the error crossed a realm boundary — an iframe, a worker, or a Node.js `vm`;
- two copies of the same package are installed, so two distinct classes exist;
- the error was serialized and revived, and is no longer an `Error` instance at all.

A string tag has none of those problems. It is a plain enumerable property, so it survives
`JSON.stringify` and `structuredClone`:

```ts
class TimeoutError extends errorClass({ name: 'TimeoutError' }) {}

const revived = JSON.parse(JSON.stringify(new TimeoutError()));
revived instanceof TimeoutError; // false
TimeoutError.is(revived); // true
```

Subclasses keep working, since a subclass reuses the constructor of its parent and is therefore
tagged as the parent:

```ts
class ChildError extends TimeoutError {}
TimeoutError.is(new ChildError()); // true
```

> [!WARNING]
> The check is structural, and the tag is derived from the error name. Two different classes
> created with the same `name` are indistinguishable, and any object carrying a matching
> `$$errorKidTag` passes the check. Use names unique to your application — prefixing them with a
> package or a domain name is usually enough.

The tag is a plain property on the instance, so it can be inspected directly when needed:

```ts
const error = new TimeoutError();
(error as any).$$errorKidTag; // '$$errorKidTag:TimeoutError'
```

> [!NOTE]
> The tag helpers (`createTag`, `hasTag`, `TAG_KEY`) are internal and are not part of the public
> entry point. Use the `is` predicate, or [`matchError`](#matcherror), instead of matching the tag
> by hand.

## `errorClassWithData`

A function that creates a new error class with typed data. It enhances the result
of calling the `errorClass` function.

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData({
  name: 'TimeoutError',
  data: (duration: number) => ({ duration }),
}) {}

const error = new TimeoutError(1000);
error.data; // { duration: 1000 }

TimeoutError.is(error); // true
```

The `data` option is a function converting the constructor arguments into the data object. When
neither `message` nor `cause` is declared as a function, `data` defines the constructor arguments.

This function accepts the same `message` and `cause` options as the `errorClass` function, and
they behave exactly the same way.

```ts
import { errorClassWithData } from 'error-kid';

class TimeoutError extends errorClassWithData({
  name: 'TimeoutError',
  data: (duration: number, cause?: unknown) => ({ duration }),
  message: (duration: number, cause?: unknown) => `Timed out: ${duration}ms`,
  cause: (_duration: number, cause?: unknown) => cause,
}) {}

const error = new TimeoutError(1000, new Error('Just because'));
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

## `matchError`

Branches on an error union by name, instead of a chain of `if (SomeError.is(error))`. Every
library error present in the value type **must** be handled — adding a new error to the union
turns every unhandled `matchError` call into a compile-time error.

```ts
import { errorClass, matchError } from 'error-kid';

class TimeoutError extends errorClass({ 
  name: 'TimeoutError', 
  message: (ms: number) => `${ms}ms` 
}) {
}
class ApiError extends errorClass({ 
  name: 'ApiError', 
  message: (status: number) => `${status}`
}) {
}

declare const error: TimeoutError | ApiError;

const message = matchError(error, {
  // Each handler receives its own error type, already narrowed.
  TimeoutError: e => `Timed out: ${e.message}`,
  ApiError: e => `Request failed: ${e.message}`,
});
```

Handlers are keyed by the error `name`. The return type is the union of all handler return types,
and a handler is free to ignore its argument.

> [!NOTE]
> A handler must accept exactly its own error type. Widening the parameter — to the whole union,
> to `Error`, or to `unknown` — is rejected, so a handler cannot silently swallow a type it was
> not written for.

Matching is based on the tag, not on the `name` property alone, so a foreign object that merely
carries a matching `name` is not routed to an error handler. Errors revived from their serialized
form, on the other hand, are matched correctly.

When nothing matches and the `loose` option is off, `matchError` throws a `TypeError`.

### `loose`

The value being matched is not always a pure error union — it may include a success value, or be
typed as `unknown`. Enabling `loose` adds a `default` handler receiving everything that is not a
library error:

```ts
const result = matchError(value, {
  TimeoutError: e => `Timed out: ${e.message}`,
  ApiError: e => `Request failed: ${e.message}`,
  default: v => `Not an error: ${v}`,
}, { loose: true });
```

With `loose` enabled, `default` is **required** — that is what makes the call total, and it
replaces the `TypeError` that would otherwise be thrown. The only exception is a value type
consisting solely of library errors: there is nothing left for `default` to receive, so it becomes
optional and takes no arguments.

Passing `default` while `loose` is off is a type error, rather than being silently ignored.

## License

[MIT](LICENSE)
