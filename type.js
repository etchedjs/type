import { etch, etches, fulfill, fulfills, iterable, model } from '@etchedjs/etched'

const { freeze, prototype: { isPrototypeOf } } = Object

const AggregateError = (() => {
  try {
    fulfill(model({
      set a (value) {
        throw new Error()
      }
    }))
  } catch ({ constructor }) {
    return constructor
  }
})()

function tag (type) {
  return model({
    [Symbol('@etchedjs/type')]: type
  })
}

const base = model(
  tag('type'),
  {
    set value (value) {}
  })

const argument = model(base)

const result = model(base)

const wrapped = new WeakMap()

const wrappers = {
  0: (name, Fn, args, expected, throwable) => ({
    [name]: function (...params) {
      merge(params, args).reduce(validateParams, [args, throwable])

      const value = new.target ? new Fn(...params) : Fn(...params)

      return model(expected, { value }).value
    }
  }[name]),
  1: (name, fn, args, expected, throwable) => ({
    async [name] (...params) {
      merge(params, args).reduce(validateParams, [args, throwable])

      const value = await fn(...params)

      return model(expected, { value }).value
    }
  }[name]),
  2: (name, fn, args, expected, throwable) => ({
    * [name] (...params) {
      merge(params, args).reduce(validateParams, [args, throwable])

      const generator = fn(...params)
      let value

      while (1) {
        const result = generator.next(value)

        if (result.done) {
          return model(expected, { value: result.value }).value
        }

        value = yield model(expected, { value: result.value }).value
      }
    }
  }[name]),
  3: (name, fn, args, expected, throwable) => ({
    async * [name] (...params) {
      merge(params, args).reduce(validateParams, [args, throwable])

      const generator = fn(...params)
      let value

      while (1) {
        const result = await generator.next(value)

        if (result.done) {
          return model(expected, { value: result.value }).value
        }

        value = yield model(expected, { value: result.value }).value
      }
    }
  }[name])
}

const flag = (current, value, key) => current + !!value * (key + 1)

const merge = (params, [...args]) => {
  const last = args[args.length - 1]

  return [
    ...new Map([
      ...Array(args.length - (last && etches(rest, last))).entries(),
      ...params.entries()
    ]).values()
  ]
}

const throwing = (throwable, { constructor, errors, message }) =>
  throwable(constructor.bind(null, ...errors ? [errors, message] : [message]))

const validate = ({ ...inputs }, model, throwable) => {
  try {
    fulfill(model, inputs)
  } catch ({ errors: [[, error]] }) {
    throw throwing(throwable, error)
  }
}

const validateParams = ([args, throwable], value, key) => {
  const arg = args[key] ?? null

  if (arg === null) {
    const last = args[args.length - 1]

    if (!etches(rest, last)) {
      throw throwing(throwable, new ReferenceError(`Unknown param @${key}`))
    }

    model(last, { value })
  } else {
    model(arg, { value })
  }

  return [args, throwable]
}

const type = (name, type, throwable, canBeNullish = false) => {
  if (!etches(base, type)) {
    throw new TypeError('Must be a type')
  }

  const validator = !canBeNullish ? type : model(nullish, { type })

  return model({
    set [name] (value) {
      validate({ value }, validator, throwable)
    }
  })
}

export const nullish = model(
  base,
  tag('nullish'),
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

          validate({ value }, type, e => e())
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
  tag('object'),
  {
    set value (value) {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new TypeError('Must be an object')
      }
    }
  })

export const boolean = model(
  base,
  tag('boolean'),
  {
    set value (value) {
      if (!!value !== value) {
        throw new TypeError('Must be a boolean')
      }
    }
  })

export const string = model(
  base,
  tag('string'),
  {
    set value (value) {
      if (typeof value !== 'string' || `${value}` !== value) {
        throw new TypeError('Must be a string')
      }
    }
  })

export const bigint = model(
  base,
  tag('bigint'),
  {
    set value (value) {
      if (typeof value !== 'bigint') {
        throw new TypeError('Must be a bigint')
      }
    }
  })

export const number = model(
  base,
  tag('number'),
  {
    set value (value) {
      if (!Number.isFinite(value)) {
        throw new TypeError('Must be a number')
      }
    }
  })

export const symbol = model(
  base,
  tag('symbol'),
  {
    set value (value) {
      if (typeof value !== 'symbol') {
        throw new TypeError('Must be a symbol')
      }
    }
  })

export const array = model(
  base,
  tag('array'),
  {
    set value (value) {
      if (!Array.isArray(value)) {
        throw new TypeError('Must be an array')
      }
    }
  })

export const etched = type => model(
  object,
  tag('etched'),
  {
    set value (value) {
      if (!etches(type, value)) {
        throw new TypeError('Must be etched')
      }
    }
  })

export const fulfilled = type => model(
  object,
  tag('fulfilled'),
  {
    set value (value) {
      if (!fulfills(type, value)) {
        throw new TypeError('Must be fulfilled')
      }
    }
  })

export const instance = ({ name, prototype }) => model(
  base,
  tag('instance'),
  {
    set value (value) {
      if (!isPrototypeOf.call(prototype, value)) {
        throw new TypeError(`Must be an instance of ${name}`)
      }
    }
  })

export const iterableOf = expectedType => model(
  object,
  tag('iterableOf'),
  type('type', base, () => {
    throw new TypeError('Must be a type')
  }),
  type('value', etched(iterable), e => e()),
  {
    type: expectedType,
    set value (value) {
      const { type } = this
      const values = [...new Map(value).values()]
      const errors = values.reduce((errors, value, key) => {
        try {
          etch(type, { value })

          return errors
        } catch ({ errors: [, error]}) {
          return [...errors, [key, error]]
        }
      }, [])

      if (errors.length) {
        throw new AggregateError(errors, 'Must be an iterable of the expected type')
      }
    }
  })

export const arg = (paramType, expected, throwable, canBeNullish = false) => {
  if (!etches(param, paramType)) {
    throw new TypeError('Must be a param type')
  }

  return model(
    argument,
    paramType,
    tag('arg'),
    type('value', expected, throwable, canBeNullish))
}

export const expected = (expected, throwable, canBeNullish) => {
  if (!etches(base, expected)) {
    throw new TypeError('Must be a type')
  }

  return model(
    result,
    tag('expected'),
    type('value', expected, throwable, canBeNullish))
}

export const fn = (type, expected, [...args], throwable) => {
  if (!etches(syncFunction, type)) {
    throw new TypeError('Must be a func type')
  }

  if (!etches(result, expected)) {
    throw new TypeError('Must be a result type')
  }

  args.forEach((current, key) => {
    if (!etches(argument, current)) {
      throw new TypeError(`Must by an argument @${key}`)
    }

    if (key < args.length - 1 && etches(rest, current)) {
      throw new TypeError(`Must by a non-rest argument @${key}`)
    }
  })

  const key = [type.async, type.generator].reduce(flag, 0)

  return model(
    type,
    tag('fn'),
    {
      expected,
      args: freeze(args),
      set value (value) {
        const wrapper = wrapped.get(value)

        if (!wrapper || !etches(wrapper, this)) {
          throw new TypeError('Must be a func')
        }
      },
      of (fn) {
        const { args, expected } = this
        const { name } = fn
        const wrapper = wrappers[key](name, fn, args, expected, throwable)

        wrapped.set(wrapper, this)

        return wrapper
      }
    }
  )
}

export const param = model(
  base,
  tag('type')
)

export const rest = model(
  param,
  tag('rest'),
  {
    rest: true
  })

export const syncFunction = model(
  base,
  tag('syncFunction'),
  type('value', instance(Function), e => e()))

export const asyncFunction = model(
  syncFunction,
  tag('asyncFunction'),
  type('value', instance((async () => {}).constructor), e => e()),
  {
    async: true
  })

export const syncGenerator = model(
  syncFunction,
  tag('syncGenerator'),
  type('value', instance(function * () {}.constructor), e => e()),
  {
    generator: true
  })

export const asyncGenerator = model(
  syncFunction,
  tag('asyncGenerator'),
  type('value', instance(async function * () {}.constructor), e => e()),
  {
    async: true,
    generator: true
  })

export const key = model(
  base,
  tag('key'),
  {
    set value (value) {
      if (!['string', 'symbol'].includes(typeof value)) {
        throw new TypeError('Must be a symbol or a string')
      }
    }
  })

export const transformer = fn(
  syncFunction,
  expected(syncFunction, e => e()),
  [
    arg(param, etched(base), e => e()),
    arg(param, etched(base), e => e()),
    arg(param, syncFunction, e => e()),
    arg(param, syncFunction, e => e())
  ],
  e => e()
).of((inputType, outputType, throwable, transform) => fn(
  syncFunction,
  expected(outputType, throwable),
  [
    arg(param, inputType, e => e())
  ],
  e => e()
).of(transform))

export default type
