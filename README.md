# @etchedjs/type

[![](https://raw.githubusercontent.com/Lcfvs/library-peer/main/badge.svg)](https://github.com/Lcfvs/library-peer#readme)

_Type **all** your JS code, only in JS, even on the runtime_

A utility to type the [`@etchedjs/etched`](https://github.com/etchedjs/etched) models.


## Install

`npm i @etchedjs/type`


## API

### `type(name, wantedType, throwable, canBeNullish = false)`

Used create a typing model
 * `name`: the setter name
 * `wantedType`: the wanted type, one of the `types` or a type extending one of them
 * `throwable`: a callback function to throw the error on the current line, always just `e => e()`
 * `canBeNullish`: an optional boolean to allow a nullish value

Example:
```js
// a module exporting a user model
import { model } from '@etchedjs/etched'
import type, * as types from '@etchedjs/type'

const user = model() // just used for a self-reference

export default model(
  user,
  type('id', types.number, e => e()), // must be a number
  type('name', types.string, e => e()), // must be a string
  type('createdAt', types.instance(Date), e => e()), // must be a date
  type('updatedAt', types.instance(Date), e => e(), true), // must be a date or nullish
  type('sponsor', types.fulfill(user), e => e(), true) // must be a user or nullish
)
```

### Types

#### `boolean`

A type to validate a boolean

#### `bigint`

A type to validate a bigint

#### `number`

A type to validate a number

#### `object`

A type to validate an object

#### `string`

A type to validate a string

#### `symbol`

A type to validate a symbol

#### `array`

A type to validate an array

#### `key`

A type to validate a key (`string` or `symbol`)

#### `syncFunction`

A type to validate a function

#### `asyncFunction`

A type to validate an asynchronous function

#### `syncGenerator`

A type to validate a generator function

#### `asyncGenerator`

A type to validate an asynchronous generator function

### Methods

#### `etched(model)`

Returns a type to validate an object that **etches** the provided `model` 

#### `fulfilled(model)`

Returns a type to validate an object that **fulfills** the provided `model` 

#### `instance(constructor)`

Returns a type to validate an object that **inherit** from the provided `constructor` prototype

#### `iterableOf(type)`

Returns a type to validate an etched `iterable` of provided type

#### `arg(type, expected, throwable, canBeNullish = false)`

* `type`: Must be one of `param`/`rest`
* `expected`: Must be a type to validate the param value
* `throwable`: a callback function to throw the error on the current line, always just `e => e()`
* `canBeNullish`: an optional boolean to allow a nullish value

#### `expected(expected, throwable, canBeNullish = false)`

* `expected`: Must be a type to validate the return value (or any promised/yielded one)
* `throwable`: a callback function to throw the error on the current line, always just `e => e()`
* `canBeNullish`: an optional boolean to allow a nullish value

#### `fn(type, expected, [...args], throwable)`

* `type`: Must be one of `syncFunction`/`asyncFunction`/`syncGenerator`/`asyncGenerator`
* `expected`: Must be a type to validate the return value (or any promised/yielded one)
* `params`: an optional array containing the argument types, inheriting from `param` or `rest`
* `throwable`: a callback function to throw the error on the current line, always just `e => e()`
  
Returns a type to validate a function, with a `.of(fn)` that returns a typed function that wraps the provided one.

Example
```js
const fnType = types.fn(
  types.asyncGenerator,
  types.expected(types.string, e => e()),
  [
     types.arg(types.param, types.string, e => e()),
     types.arg(types.rest, types.string, e => e())
  ],
  e => e())

const fn = fnType.of(async function * (first, ...rest) {
   const values = [first, ...rest]

   while (values.length > 1) {
      yield values.shift()
   }

   return values.shift()
})

const generator = fn('first', 'second', 'third')

console.log(await generator.next()) // { value: 'first', done: false }
console.log(await generator.next()) // { value: 'second', done: false }
console.log(await generator.next()) // { value: 'third', done: false }
```

### Flags

The flags are some special types to add a specific behavior on a type

#### `nullish`

A flag to allow a nullish value

```js
model(nullish, { type })
```

#### `param`

A flag to mark a type as a function parameter

```js
model(param, type)
```

#### `rest`

A flag that extends `param` but for a rest parameterparameter

```js
model(rest, type)
```

## Extend a type

```js
// a module exporting an integer type, extending number 
import { model } from '@etchedjs/etched'
import { number } from '@etchedjs/type'

export default model(number, {
  set value (value) {
    if (!Number.isInteger(value)) {
      throw new TypeError('Must be an integer')
    }
  }
})
```

More some complex type examples: https://gist.github.com/Lcfvs/4b1523653bfe54605b82113170299f61 

## Licence

MIT
