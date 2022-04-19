// Metadata validation schema
export const metadataSchema = {
  name: {
    validate: validateString({ min: 1, message: 'must have a name' })
  },
}

/**
 * Returns a number validator from the given options.
 * 
 * @param {boolean} opts.allowBlank Allow blank value
 * @param {boolean} opts.integer Must be an integer
 * @param {number} opts.min Minimum value
 * @param {number} opts.max Maximum value
 * @param {number} opts.message Error message
 * @returns {object}
 */
export function validateNumber({ allowBlank, integer, min, max, message } = {}) {
  return {
    message: message || 'must be a number',
    
    validator(val) {
      if (allowBlank && !val)                           return true;
      if (typeof val !== 'number')                      return false;
      if (integer && !Number.isInteger(val))            return false;
      if (typeof min === 'number' && val < min)         return false;
      if (typeof max === 'number' && val > params.max)  return false;
      return true;
    }
  }
}

/**
 * Returns an object validator from the given options.
 * 
 * @param {boolean} opts.allowBlank Allow blank value
 * @param {object} opts.schema Validation schema
 * @param {number} opts.message Error message
 * @returns {object}
 */
 export function validateObject({ allowBlank, assert, schema, message } = {}) {
  return {
    message: message || 'must be a number',
    
    validator(val) {
      if (allowBlank && !val)                           return true;
      if (typeof val !== 'object')                      return false;
      if (schema && !validateParams(val, schema))       return false;
      if (typeof assert === 'function' && !assert(val)) return false;
      return true;
    }
  }
}

/**
 * Returns a string validator from the given options.
 * 
 * @param {boolean} opts.allowBlank Allow blank value
 * @param {regexp} opts.matches Format validator
 * @param {number} opts.min Minimum length
 * @param {number} opts.max Maximum length
 * @param {number} opts.message Error message
 * @returns {object}
 */
export function validateString({ allowBlank, matches, min, max, message } = {}) {
  return {
    message: message || 'must be a string',

    validator(val) {
      if (allowBlank && !val)                           return true;
      if (typeof val !== 'string')                      return false;
      if (matches && !matches.test(val))                return false;
      if (typeof min === 'number' && val.length < min)  return false;
      if (typeof max === 'number' && val.length > max)  return false;
      return true;
    }
  }
}

/**
 * Validates the params using the given schema. Throws an error if validation
 * fails.
 * 
 * @param {object} params Parameters
 * @param {object} schema Validation schema
 * @returns {object}
 */
 export function validateParams(params, schema) {
  if (typeof params !== 'object') {
    throw new Error('invalid params')
  }

  for (const key of Object.keys(schema)) {
    const { validator, message } = schema[key].validate

    // Set default
    if (!params[key] && typeof schema[key].defaultValue !== 'undefined') {
      params[key] = schema[key].defaultValue
    }

    // Assert validation
    if (typeof validator === 'function' && !validator(params[key])) {
      throw new Error(`'${key}' is invalid. ${message}`)
    }
  }

  return params
}