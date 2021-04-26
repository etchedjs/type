import { etches, fulfill, fulfills, model } from '@etchedjs/etched'

const { prototype: { isPrototypeOf } } = Object

const validate = ({ ...inputs }, model, throwable) => {
  try {
    fulfill(model, inputs)
  } catch ({ errors: [[, error]] }) {
    throwable(error)
    throw new Error('Must be thrown')
  }
}

const base = model({
  set value (value) {}
})

const nullish = model(base, {
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
      const { constructor, errors, message } = error

      throw new constructor(...[errors, `${message} or be nullish`].filter(Boolean))
    }
  }
})

export const etched = type => model(object, {
  set value (value) {
    if (!etches(type, value)) {
      throw new TypeError('Must be etched')
    }
  }
})

export const fulfilled = type => model(object, {
  set value (value) {
    if (!fulfills(type, value)) {
      throw new TypeError('Must be fulfilled')
    }
  }
})

export const instance = ({ name, prototype }) => model(object, {
  set value (value) {
    if (!isPrototypeOf.call(prototype, value)) {
      throw new TypeError(`Must be an instance of ${name}`)
    }
  }
})

export const array = model(base, {
  set value (value) {
    if (!Array.isArray(value)) {
      throw new TypeError('Must be an array')
    }
  }
})

export const boolean = model(base, {
  set value (value) {
    if (!!value !== value) {
      throw new TypeError('Must be a boolean')
    }
  }
})

export const func = model(base, {
  set value (value) {
    if (typeof value !== 'function') {
      throw new TypeError('Must be a function')
    }
  }
})

export const number = model(base, {
  set value (value) {
    if (!Number.isFinite(value)) {
      throw new TypeError('Must be a number')
    }
  }
})

export const object = model(base, {
  set value (value) {
    if (typeof value !== 'object' || value === null) {
      throw new TypeError('Must be an object')
    }
  }
})

export const string = model(base, {
  set value (value) {
    if (typeof value !== 'string' || `${value}` !== value) {
      throw new TypeError('Must be a string')
    }
  }
})

export const symbol = model(base, {
  set value (value) {
    if (typeof value !== 'symbol') {
      throw new TypeError('Must be a symbol')
    }
  }
})

export default (name, type, throwable, canBeNullish = false) => {
  etches(base, type, error => { throw error })

  const validator = !canBeNullish ? type : model(nullish, { type })

  return model({
    set [name] (value) {
      validate({ value }, validator, throwable)
    }
  })
}
