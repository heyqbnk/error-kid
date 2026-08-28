import { it, expect, describe } from 'vitest';

import { errorClass } from './errorClass.js';

it('should create a class with specified "name" property', () => {
  const UnknownError = errorClass({ name: 'UnknownError' });
  expect(UnknownError.name).toBe('UnknownError');
});

it('should apply "message" option', () => {
  const Class1 = errorClass({ name: 'Class1', message: 'Error message' });
  expect(new Class1().message).toBe('Error message');

  const Class2 = errorClass({ name: 'Class2', message: () => 'Error message 2' });
  expect(new Class2().message).toBe('Error message 2');

  const Class3 = errorClass({
    name: 'Class3',
    message: (errorNum: number) => `Error message ${errorNum}`
  });
  expect(new Class3(3).message).toBe('Error message 3');
});

it('should apply "cause" option', () => {
  const Class1 = errorClass({
    name: 'Class1',
    cause: () => 'Error cause'
  });
  expect(new Class1().cause).toBe('Error cause');

  const rootCause = new Error('Just because');
  const Class2 = errorClass({
    name: 'Class2',
    cause: (rootCause: unknown) => rootCause
  });
  expect(new Class2(rootCause).cause).toBe(rootCause);
});

describe('instance', () => {
  it('should have proper name and message properties', () => {
    const Error1 = errorClass({ name: 'Error1' });
    const error1 = new Error1();
    expect(error1.name).toBe('Error1');
    expect(error1.message).toBe('');
    expect(error1.cause).toBeUndefined();

    const Error2 = errorClass({
      name: 'Error2',
      message: 'Test',
      cause: () => 'Something'
    });
    const error2 = new Error2();
    expect(error2.name).toBe('Error2');
    expect(error2.message).toBe('Test');
    expect(error2.cause).toBe('Something');
  });

  it('should be instance of Error and its class', () => {
    const UnknownError = errorClass({ name: 'UnknownError' });
    expect(new UnknownError()).toBeInstanceOf(Error);
    expect(new UnknownError()).toBeInstanceOf(UnknownError);
  });
});

describe('is', () => {
  it('should return true if value is instance of created class', () => {
    const UnknownError = errorClass({ name: 'UnknownError' });

    class EnhancedUnknownError extends UnknownError { }

    expect(UnknownError.is(new UnknownError)).toBe(true);
    expect(UnknownError.is(new EnhancedUnknownError())).toBe(true);
    expect(UnknownError.is(123)).toBe(false);
    expect(UnknownError.is(new Error())).toBe(false);
  });

  it('should return false for non-object values', () => {
    const UnknownError = errorClass({ name: 'UnknownError' });
    for (const value of [undefined, null, 0, '', 'error-kid:UnknownError', true, Symbol()]) {
      expect(UnknownError.is(value)).toBe(false);
    }
  });

  it('should not confuse classes sharing no name', () => {
    const AError = errorClass({ name: 'AError' });
    const BError = errorClass({ name: 'BError' });

    expect(AError.is(new BError())).toBe(false);
    expect(BError.is(new AError())).toBe(false);
  });

  it('should return true for a subclass instance, but not vice versa', () => {
    const ParentError = errorClass({ name: 'ParentError' });
    const ChildError = errorClass({ name: 'ChildError' });

    class Child extends ChildError { }

    // A tag is bound to a name, so unrelated classes never cross-match.
    expect(ParentError.is(new Child())).toBe(false);
    expect(ChildError.is(new Child())).toBe(true);
  });

  it('should work for an error restored from its serialized form', () => {
    const TimeoutError = errorClass({ name: 'TimeoutError', message: 'Timed out' });

    const revived = JSON.parse(JSON.stringify(new TimeoutError()));
    // The revived value is a plain object, so instanceof would fail here.
    expect(revived instanceof TimeoutError).toBe(false);
    expect(TimeoutError.is(revived)).toBe(true);
  });

  it('should work across independently created classes sharing a name', () => {
    // Emulates two copies of the same package, or two realms, declaring the same error.
    const CopyA = errorClass({ name: 'DuplicatedError' });
    const CopyB = errorClass({ name: 'DuplicatedError' });

    expect(new CopyA() instanceof CopyB).toBe(false);
    expect(CopyB.is(new CopyA())).toBe(true);
    expect(CopyA.is(new CopyB())).toBe(true);
  });
});
