import Run from 'run-sdk'
import nimble from '@runonbitcoin/nimble'
import $ from '../state.js'
import { JigBox } from './box.js'
import { OrderLock } from './order-lock-class.js'
import {
  validateNumber,
  validateObject,
  validateString,
  validateParams,
} from './validations.js'

// Offer validation Schema
const schema = {
  jig: {
    validate: validateObject({ allowBlank: true, assert: isJig, message: 'must be a Jig' })
  },
  jigbox: {
    validate: validateObject({ allowBlank: true, assert: isJigBox, message: 'must be a JigBox' })
  },
  amount: {
    validate: validateNumber({ allowBlank: true, integer: true, min: 1 })
  },
  address: {
    validate: validateString({ matches: /^[13m][a-km-zA-HJ-NP-Z1-9]{25,34}$/, message: 'must be a Bitcoin address' })
  },
  satoshis: {
    validate: validateNumber({ integer: true, min: 1 })
  }
}

// Helper to assert an object is a Jig
function isJig(subject) {
  return subject.origin && subject.location
}

// Helper to assert an object is a JigBox
function isJigBox(subject) {
  return subject instanceof JigBox
}

/**
 * Creates and returns an offer from the given parameters.
 * 
 * @async
 * @param {object} params Offer parameters
 * @returns {Promise<Run.Jig>}
 */
export async function createOffer(params = {}) {
  const {
    jig,
    jigbox,
    amount,
    address,
    satoshis
  } = validateParams(params, schema)

  if (!jig && !(jigbox && amount)) {
    throw new Error('offer must be created from a jig or jigbox with amount')
  }

  const lock = new OrderLock(address, satoshis)

  if (jigbox) {
    return createOfferFromJigbox(jigbox, amount, lock)
  } else {
    return createOfferFromJig(jig, lock)
  }
}

/**
 * Creates an offer from the JigBox using the given OrderLock.
 * 
 * @async
 * @param {JigBox} jigbox Jigbox instance
 * @param {number} amount Amount of tokens offered
 * @param {OrderLock} lock OrderLock instance
 * @returns {Promise<Run.Jig>}
 */
async function createOfferFromJigbox(jigbox, amount, lock) {
  const tx = await offerBaseTx()
  if (jigbox.jigs.length > 1) {
    tx.update(() => jigbox.jigs[0].combine(...jigbox.jigs.slice(1)))
  }
  tx.update(() => jigbox.jigs[0].send(lock, amount))

  // Publish then return the locked jig
  const txid = await tx.publish()
  await $.run.sync()
  return $.run.load(`${ txid }_o3`)
}

/**
 * Creates an offer from the Jig using the given OrderLock.
 * 
 * @async
 * @param {Run.Jig} jig Jig offered
 * @param {OrderLock} lock OrderLock instance
 * @returns {Promise<Run.Jig>}
 */
async function createOfferFromJig(jig, lock) {
  const tx = await offerBaseTx()
  tx.update(() => jig.send(lock))
  await tx.publish()
  await jig.sync()
  return jig
}

// Helper function returns a base tx for the offer transaction
async function offerBaseTx() {
  const myself = await $.run.owner.nextOwner()
  const base = new nimble.Transaction()
  base.to(myself, 150)
  const tx = new Run.Transaction()
  tx.base = base.toHex()
  return tx
}
