import Run from 'run-sdk'
import $ from '../state.js'

/**
 * Iterates over the given props and attaches them to the class as static properties.
 * Attaches literal values only, ignoring any functions.
 * 
 * @param {class} klass Target class
 * @param {object} props Propeties
 */
export function applyStaticProps(klass, props) {
  Object.keys(props)
    .filter(key => typeof props[key] !== 'function')
    .forEach(key => {
      klass[key] = props[key]
    })
}

/**
 * Dynamically creates a class with the given name, extending from the given
 * parent class.
 * 
 * If `transferable` is true, a static `transfer(owner)` function is added.
 * 
 * @param {string} name Class name
 * @param {class} klass Parent class
 * @param {boolean} transferable Defaults false
 * @returns {class}
 */
export function createClass(name, klass, transferable = false) {
  const transferFn = transferable ?
    `static transfer(to) { this.owner = to }` :
    '';

  return new Function('klass', `
    return class ${ name } extends klass {
      ${ transferFn }
    }
  `)(klass)
}

/**
 * Deploys the class and returns a Run Code instance.
 * 
 * @async
 * @param {class} klass Undeployed class
 * @return {Promise<Run.Code>}
 */
export async function deployClass(klass) {
  const code = $.run.deploy(klass)
  await $.run.sync()
  return code
}

/**
 * Loads the Code from the origin and calls mint for each of the given recipients.
 * 
 * All mint ops are consolidated in a single transaction and the txid returned.
 * 
 * @async
 * @param {string} origin Code origin
 * @param {array[]} recipients Array of array of arguments
 * @return {Promise<txid>}
 */
export async function mintTokens(origin, recipients) {
  if (!Array.isArray(recipients)) {
    throw new Error('Invalid recipients. `mint(origin, recipients)` expects an array of recipients.')
  }

  const klass = await $.run.load(origin)
  await klass.sync()

  const tx = new Run.Transaction()
  for (let args of recipients) {
    if (!Array.isArray(args)) args = [args];
    tx.update(() => klass.mint(...args))
  }
  return tx.publish()
}

/**
 * Loads the Code from the origin and upgrades it with the given undeployed class.
 * 
 * By default all static properties from the original class are copied to the
 * new class. Avoid this by explicitly listing changed static props.
 * 
 * @async
 * @param {string} origin Code origin
 * @param {class} newClass Undeployed class
 * @param {string[]} updated Array of updated static properties
 * @return {Promise<Run.Code>}
 */
export async function upgradeClass(origin, newClass, updated = []) {
  const klass = await $.run.load(origin)
  await klass.sync()

  const updatedProps = updated.concat(['location', 'origin', 'nonce', 'owner', 'satoshis'])
  
  // Copy state from existing klass to new
  // except explicitly updated props and RUN bindings
  Object.keys(klass)
    .filter(k => !updatedProps.includes(k))
    .forEach(k => newClass[k] = klass[k])

  klass.upgrade(newClass)
  await klass.sync()

  return klass
}

