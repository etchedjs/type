import { etches, fulfill, fulfills, model } from '@etchedjs/etched'

const { freeze, prototype: { isPrototypeOf } } = Object

const base = model({
  set value (value) {}
})

const flag = (current, value, key) => current + !!value * (key + 1)

const merge = (params, types) => {
  const last = types[types.length - 1]

  return [
    ...new Map([
      ...Array(types.length - (last && etches(rest, last))).entries(),
      ...params.entries()
    ]).values()
  ]
}

const validate = ({ ...inputs }, model, throwable) => {
  try {
    fulfill(model, inputs)
  } catch ({ errors: [[, error]] }) {
    throwable(error)
    throw new Error('Must be thrown')
  }
}

const validateExpected = (value, throwable, type = null) => {
  try {
    if (type === null && value !== undefined) {
      throw new TypeError('Must match an expected type')
    }

    return fulfill(type, {value}).value
  } catch (error) {
    throw throwable(error)
  }
}

const validateMerged = (params, types, throwable) => merge(params, types)
  .reduce(validateParams, [types, throwable])

const validateParams = ([params, throwable], value, key) => {
  const param = params[key] ?? null

  if (param === null) {
    const last = params[params.length - 1]

    if (!etches(last, rest)) {
      throw throwable(new ReferenceError(`Unknown param @${key}`))
    }

    validateExpected(value, throwable, last)
  } else {
    validateExpected(value, throwable, param)
  }

  return [params, throwable]
}

const wrappers = new WeakMap()

const wrappings = {
  0: (name, Fn, types, throwable) => ({
    [name] (...params) {
      validateMerged(params, types.params, throwable)

      const value = new.target ? new Fn(...params) : Fn(...params)

      return validateExpected(value, throwable, types.expected)
    }
  }[name]),
  1: (name, fn, types, throwable) => ({
    async [name] (...params) {
      validateMerged(params, types.params, throwable)

      const value = await fn(...params)

      return validateExpected(value, throwable, types.expected)
    }
  }[name]),
  2: (name, fn, types, throwable) => ({
    * [name] (...params) {
      validateMerged(params, types.params, throwable)

      const generator = fn(...params)
      let value

      while (1) {
        const result = generator.next(value)

        if (result.done) {
          break
        }

        value = yield validateExpected(result.value, throwable, types.expected)
      }
    }
  }[name]),
  3: (name, fn, types, throwable) => ({
    async * [name] (...params) {
      validateMerged(params, types.params, throwable)

      const generator = fn(...params)
      let value

      while (1) {
        const result = await generator.next(value)

        if (result.done) {
          break
        }

        value = yield validateExpected(result.value, throwable, types.expected)
      }
    }
  }[name])
}

const type = (name, type, throwable, canBeNullish = false) => {
  etches(base, type, error => { throw error })

  const validator = !canBeNullish ? type : model(nullish, { type })

  return model({
    set [name] (value) {
      validate({ value }, validator, throwable)
    }
  })
}

export const nullish = model(
  base,
  {
    set type (value) {
      if (!etches(base, value)) {
        throw new TypeError('Must be a type')
      }
    },
    set value (value) {
      try {
        if ((value ?? null) !== null) {
          const { type } = this

          validate({ value }, type, error => { throw error })
        }
      } catch (error) {
        const { constructor, errors } = error
        const message = `${error.message} or be nullish`

        throw new constructor(...[errors, message].filter(Boolean))
      }
    }
  })

export const object = model(
  base,
  {
    set value (value) {
      if (typeof value !== 'object' || value === null) {
        throw new TypeError('Must be an object')
      }
    }
  })

export const boolean = model(
  base,
  {
    set value (value) {
      if (!!value !== value) {
        throw new TypeError('Must be a boolean')
      }
    }
  })

export const string = model(
  base,
  {
    set value (value) {
      if (typeof value !== 'string' || `${value}` !== value) {
        throw new TypeError('Must be a string')
      }
    }
  })

export const bigint = model(
  base,
  {
    set value (value) {
      if (typeof value === 'bigint') {
        throw new TypeError('Must be a bigint')
      }
    }
  })

export const number = model(
  base,
  {
    set value (value) {
      if (!Number.isFinite(value)) {
        throw new TypeError('Must be a number')
      }
    }
  })

export const symbol = model(
  base,
  {
    set value (value) {
      if (typeof value !== 'symbol') {
        throw new TypeError('Must be a symbol')
      }
    }
  })

export const array = model(
  base,
  {
    set value (value) {
      if (!Array.isArray(value)) {
        throw new TypeError('Must be an array')
      }
    }
  })

export const arrayOf = model(
  array,
  type('type', base, () => {
    throw new TypeError('Must be a type')
  }),
  {
    set value (value) {
      const { type } = this

      if (!value.every(current => fulfills(type, current))) {
        throw new TypeError('Must be an array of the provided type')
      }
    }
  })

export const etched = type => model(
  object,
  {
    set value (value) {
      if (!etches(type, value)) {
        throw new TypeError('Must be etched')
      }
    }
  })

export const fulfilled = type => model(
  object,
  {
    set value (value) {
      if (!fulfills(type, value)) {
        throw new TypeError('Must be fulfilled')
      }
    }
  })

export const instance = ({ name, prototype }) => model(
  base,
  {
    set value (value) {
      if (!isPrototypeOf.call(prototype, value)) {
        throw new TypeError(`Must be an instance of ${name}`)
      }
    }
  })

export const fn = (type, expected = null, [...params] = []) => {
  if (!etches(func, type)) {
    throw new TypeError('Must be a func type')
  }

  if (!etches(base, expected ?? base)) {
    throw new TypeError('Must be a type')
  }

  params.forEach((current, key) => {
    if (!etches(param, current)) {
      throw new TypeError(`Must by a param @${key}`)
    }

    if (key < params.length - 1 && etches(rest, current)) {
      throw new TypeError(`Must by a non-rest param @${key}`)
    }
  })

  const key = [type.async, type.generatorFunc].reduce(flag, 0)

  return model(type, {
    expected: expected ?? undefined,
    params: freeze(params),
    set value (value) {
      const wrapper = wrappers.get(value)

      if (!wrapper || !etches(wrapper, this)) {
        throw new TypeError('Must be a func')
      }
    },
    of (fn, throwable) {
      const { name } = fn
      const wrapper = wrappings[key](name, fn, { expected, params }, throwable)

      wrappers.set(wrapper, this)

      return wrapper
    }
  })
}

export const param = model(base)

export const rest = model(
  param,
  {
    rest: true
  })

export const func = model(
  base,
  type('value', instance(Function), e => { throw e }))

export const asyncFunc = model(
  func,
  type('value', instance((async () => {}).constructor), e => { throw e }),
  {
    async: true
  })

export const generatorFunc = model(
  func,
  type('value', instance(function * () {}.constructor), e => { throw e }),
  {
    generatorFunc: true
  })

export const asyncGeneratorFunc = model(
  func,
  type('value', instance(async function * () {}.constructor), e => { throw e }),
  {
    async: true,
    generatorFunc: true
  })

export default type
