import { NFT } from './nft-class.js'
import { JigBox } from './box.js'
import {
  applyStaticProps,
  createClass,
  deployClass,
  upgradeClass,
} from './shared.js'
import {
  metadataSchema,
  validateString,
  validateObject,
  validateNumber,
  validateParams,
} from './validations.js'

// Params validation Schema
const schema = {
  className: {
    defaultValue: 'NFT',
    validate: validateString({ matches: /^[a-z]\w*$/i, min: 1, message: 'must be valid JavaScript class name' })
  },
  metadata: {
    validate: validateObject({ schema: metadataSchema, message: 'must be valid RUN metadata' })
  },
  maxSupply: {
    validate: validateNumber({ integer: true, min: 1, allowBlank: true })
  }
}

/**
 * Dynamically creates a Class extending from Run.extra.NFT.
 * 
 * @param {object} params Token parameters
 * @returns {class}
 */
export function create(params) {
  const {
    className,
    metadata,
    maxSupply,
    transferable,
    ...props
  } = validateParams(params, schema)

  // Dynamically create class from base
  const klass = createClass(className, NFT, transferable)

  // Set static props
  klass.metadata = metadata
  klass.sealed = false
  klass.supply = 0
  klass.total = 0
  if (maxSupply) klass.maxSupply = maxSupply

  // Attach arbitrary static props
  applyStaticProps(klass, props)

  return klass
}

/**
 * Dynamically creates and deploys a class extending from Run.extra.NFT.
 * Optionally can be given an existing undeployed class.
 * 
 * @async
 * @param {object|class} params Token parameters or undeployed class
 * @returns {Promise<Run.Code>}
 */
export async function deploy(params) {
  const klass = /^class\s+/.test(params.toString()) ?
    params :
    create(params);

  return deployClass(klass)
}

/**
 * Fetches Code from the origin and upgrades it with the given parameters.
 * 
 * @async
 * @param {string} origin Code origin
 * @param {object|class} params Token parameters or undeployed class
 * @returns {Promise<Run.Code>}
 */
export async function upgrade(origin, params) {
  const klass = /^class\s+/.test(params.toString()) ?
    params :
    create(params);

  // Build list of updated keys, except protected
  const updated = Object.keys(klass)
    .filter(k => !['max', 'maxSupply', 'supply', 'total'].includes(k))

  return upgradeClass(origin, klass, updated)
}

/**
 * Returns the current Run owner's JigBox for the given code origin.
 * 
 * @async
 * @param {string} origin Code origin
 * @returns {Promise<JigBox>}
 */
 export async function getJigBox(origin) {
  return JigBox.fromOrigin(origin, 'nft')
}

export {
  mintTokens as mint
} from './shared.js'
