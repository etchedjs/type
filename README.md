# @etchedjs/type

[![](https://raw.githubusercontent.com/Lcfvs/library-peer/main/badge.svg)](https://github.com/Lcfvs/library-peer#readme)

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

### `types`

#### `array`

A type to validate an array

#### `boolean`

A type to validate a boolean

#### `func`

A type to validate a function

#### `number`

A type to validate a number

#### `object`

A type to validate an object

#### `string`

A type to validate a string

#### `symbol`

A type to validate a symbol

#### `etched(model)`

Returns a type to validate an object that **etches** the provided `model` 

#### `fulfilled(model)`

Returns a type to validate an object that **fulfills** the provided `model` 

#### `instance(constructor)`

Returns a type to validate an object that **inherit** from the provided `constructor` prototype 

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
