import $ from '../run.js'
import { JigBox } from './box.js'
import { loadOrderLock } from './shared.js'
import {
  validateNumber,
  validateObject,
  validateString,
  validateParams,
} from './validations.js'

const { BufferWriter, Transaction } = $.Run.nimble
const { opcodes, sighashFlags } = $.Run.nimble.constants
const { preimage, writePushData, verifyScriptAsync } = $.Run.nimble.functions

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
    validate: validateString({ matches: /^[132nm][a-km-zA-HJ-NP-Z1-9]{25,34}$/, message: 'must be a Bitcoin address' })
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
 * Fetches a list of jigs owned by the OrderLock for the given class origin.
 * 
 * @param {string} origin 
 * @returns {Promise<Run.Jig[]>}
 */
export async function listOffers(origin) {
  const OrderLock = await loadOrderLock()
  const url = `https://api.run.network/v1/${ $.run.network }/run-db/unspent?class=${ origin }&lock=${ OrderLock.location }`

  const txids = await ky(url).json()
  console.log({ txids })
}

/**
 * Creates and returns an offer from the given parameters.
 * 
 * @param {object} params Offer parameters
 * @returns {Promise<Run.Jig>}
 */
export async function makeOffer(params = {}) {
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

  const OrderLock = await loadOrderLock()

  const tx = await offerBaseTx(address)
  const lock = new OrderLock(address, satoshis)

  if (jigbox) {
    return createOfferFromJigBox(tx, jigbox, amount, lock)
  } else {
    return createOfferFromJig(tx, jig, lock)
  }
}

// Helper function returns a base tx for the offer transaction
async function offerBaseTx(address) {
  const tx = new $.Run.Transaction()

  const base = new Transaction()
  base.to(address, 546) // cancel utxo
  tx.base = base.toHex()

  return tx
}

// Creates offer jig from the offered jig
async function createOfferFromJig(tx, jig, lock) {
  tx.update(() => jig.send(lock))
  await tx.publish()
  await jig.sync()
  return jig
}

// Creates offer jig from a jigbox
async function createOfferFromJigBox(tx, jigbox, amount, lock) {
  if (jigbox.jigs.length > 1) {
    tx.update(() => jigbox.jigs[0].combine(...jigbox.jigs.slice(1)))
  }
  tx.update(() => jigbox.jigs[0].send(lock, amount))

  // Publish then return the locked jig
  const txid = await tx.publish()
  await $.run.sync()
  // TODO - test this with and without combines to ensure the index is correct
  return $.run.load(`${ txid }_o${ 3 }`)
}

/**
 * Accepts an offer by the given jig location. Uses the Run instance purse to
 * pay for the offer. Returns a txid.
 * 
 * @param {string} location Offer location
 * @returns {Promise<string>}
 */
export async function takeOffer(location) {
  const [txid, idx] = location.split('_o')
  const offerRaw = await $.run.blockchain.fetch(txid)
  const offerTx = Transaction.fromHex(offerRaw)
  const offerTxOut = offerTx.outputs[idx]
  const offer = await $.run.load(location)

  const tx = await takeOfferBaseTx(offer)
  tx.inputs[0].script = offerUnlockScript(tx, 0, offerTxOut)

  try {
    await verifyScriptAsync(tx.inputs[0].script, offerTxOut.script, tx, 0, offerTxOut.satoshis)
    console.log('NIMBLE VERIFY', true)
  } catch(e) {
    console.log('NIMBLE VERIFY', false)
    console.log(e)
  }

  const rawtx = tx.toHex()
  console.log(rawtx)
  return rawtx

  //const txid = await $.run.blockchain.broadcast(rawtx)
  //return $.run.load(`${txid}_o2`)
}

/**
 * Cancels an offer by the given jig location. Returns a txid.
 * 
 * @param {string} location Offer location
 * @returns {Promise<string>}
 */
export async function cancelOffer(location) {
  const [txid, idx] = location.split('_o')
  const offerRaw = await $.run.blockchain.fetch(txid)
  const offerTx = Transaction.fromHex(offerRaw)
  const offerTxOut = offerTx.outputs[idx]
  const offer = await $.run.load(location)

  const tx = await cancelOfferBaseTx(offer, offerTx.outputs[0])
  tx.inputs[0].script = offerUnlockScript(tx, 0, offerTxOut, true)

  try {
    await verifyScriptAsync(tx.inputs[0].script, offerTxOut.script, tx, 0, offerTxOut.satoshis)
    console.log('NIMBLE VERIFY', true)
  } catch(e) {
    console.log('NIMBLE VERIFY', false)
    console.log(e)
  }

  const rawtx = tx.toHex()
  console.log(rawtx)

  //const txid = await $.run.blockchain.broadcast(rawtx)
  //return $.run.load(`${txid}_o2`)
}

// Helper function returns a base tx for the take offer transaction
async function takeOfferBaseTx(offer) {
  const myself = await $.run.owner.nextOwner()
  const runtx = new $.Run.Transaction()

  const base = new Transaction()
  base.to(offer.owner.address, offer.owner.satoshis)
  runtx.base = base.toHex()

  runtx.update(() => offer.send(myself, offer.amount))

  const raw = await runtx.export({ sign: false, pay: true })
  runtx.rollback()

  return Transaction.fromHex(raw)
}

// Helper function returns a base tx for the cancel offer transaction
async function cancelOfferBaseTx(offer, cancelTxOut) {
  const myself = await $.run.owner.nextOwner()
  const runtx = new $.Run.Transaction()

  runtx.update(() => offer.send(myself, offer.amount))

  const raw = await runtx.export({ sign: false, pay: false })
  runtx.rollback()

  const tx = Transaction.fromHex(raw)
  tx.from(cancelTxOut)
  tx.sign($.run.purse.privkey)
  return tx
}

// Helper function returns the offer unlock script
function offerUnlockScript(tx, vin, { script, satoshis }, cancel = false) {
  const sighashType = cancel ?
    sighashFlags.SIGHASH_NONE | sighashFlags.SIGHASH_FORKID :
    sighashFlags.SIGHASH_SINGLE | sighashFlags.SIGHASH_ANYONECANPAY | sighashFlags.SIGHASH_FORKID;

  const preimg = preimage(tx, vin, script, satoshis, sighashType)

  // Write unlocking script
  const buf = new BufferWriter()
  writePushData(buf, preimg)                                  // preimg
  buf.write([opcodes.OP_0])                                   // trailing prevouts
  buf.write([cancel ? opcodes.OP_TRUE : opcodes.OP_FALSE])    // cancel op_true or op_false

  return buf.toBuffer()
}