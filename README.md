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
 * `throwable`: a callback function to throw the error on the current line, always just `e => { throw e }`
   (it avoids digging into the error stack trace)
 * `canBeNullish`: an optional boolean to allow a nullish value

Example:
```js
// a module exporting a user model
import { model } from '@etchedjs/etched'
import type, * as types from '@etchedjs/type'

const user = model() // just used for a self-reference

export default model(
  user,
  type('id', types.number, e => { throw e }), // must be a number
  type('name', types.string, e => { throw e }), // must be a string
  type('createdAt', types.instance(Date), e => { throw e }), // must be a date
  type('updatedAt', types.instance(Date), e => { throw e }, true), // must be a date or nullish
  type('sponsor', types.fulfill(user), e => { throw e }, true) // must be a user or nullish
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

#### `arrayOf`

A type to validate an array of provided type

#### `func`

A type to validate a function

#### `asyncFunc`

A type to validate an asynchronous function

#### `generatorFunc`

A type to validate a generator function

#### `asyncGeneratorFunc`

A type to validate an asynchronous generator function

### Methods

#### `etched(model)`

Returns a type to validate an object that **etches** the provided `model` 

#### `fulfilled(model)`

Returns a type to validate an object that **fulfills** the provided `model` 

#### `instance(constructor)`

Returns a type to validate an object that **inherit** from the provided `constructor` prototype

#### `fn(type, expected = null, [...params] = [])`

* `type`: Must be one of `func`/`asyncFunc`/`generator`/`asyncGenerator`
* `expected`: Must be a type of be **nullish**, to validate the return value (or any promised/yielded one)
* `params`: an optional array containing the argument types, inheriting from `param` or `rest`
  
Returns a type to validate a function, with a `.of(fn, throwable)` that returns a typed function that wraps the provided one.

Example
```js
const fnType = types.fn(types.asyncGeneratorFunc, types.string, [
  model(types.param, types.string),
  model(types.rest, types.string)
])

const fn = fnType.of(async function * (first, ...rest) {
   const values = [first, ...rest]

   while (values.length) {
      yield values.shift()
   }
}, e => { throw e })

const generator = fn('first', 'second')

console.log(await generator.next()) // { value: 'first', done: false }
console.log(await generator.next()) // { value: 'second', done: false }
console.log(await generator.next()) // { value: undefined, done: true }
```

### Flags

The flags are some special types to add a specific behavior on a type

Syntax: `flaggedType = model(flag, { type })`

#### `nullish`

A flag to allow a nullish value

#### `param`

A flag to mark a type as a function parameter

#### `rest`

A flag that extends `param` but for a rest parameter

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

## Licence

MIT
