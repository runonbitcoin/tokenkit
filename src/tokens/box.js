import Run from 'run-sdk'
import $ from '../run.js'

/**
 * JigBox class.
 */
export class JigBox {
  /**
   * Creates a new JigBox. Use of `JigBox.fromClass()` and `JigBox.fromOrigin()`
   * is preferred.
   * 
   * @constructor
   * @param {object} params JigBox parameters
   */
  constructor({ contract, type }) {
    if (!type || !['FT', 'NFT'].includes(type.toUpperCase())) {
      throw new Error('Invalid JigBox type. Must be `FT` or `NFT`.')
    }

    this.contract = contract
    this.jigs     = []
    this.type     = type.toUpperCase()
  }

  /**
   * Creates a JigBox from the given Run.Code class.
   * 
   * @async
   * @constructor
   * @param {Run.Code} contract Deployed code
   * @param {string} type FT or NFT
   * @returns {Promise<JigBox>}
   */
  static async fromClass(contract, type) {
    const box = new this({ contract, type })
    await box.sync()
    return box
  }

  /**
   * Creates a JigBox from the given Run.Code origin.
   * 
   * @async
   * @constructor
   * @param {string} contract Deployed code origin
   * @param {string} type FT or NFT
   * @returns {Promise<JigBox>}
   */
  static async fromOrigin(origin, type) {
    const contract = await $.run.load(origin)
    await contract.sync()
    return this.fromClass(contract, type)
  }

  /**
   * Gets the balance of the JigBox.
   */
  get balance() {
    ensureFungibleToken(this)
    return this.jigs.reduce((sum, jig) => sum + jig.amount, 0)
  }

  /**
   * Gets the balance of the JigBox formatted as a decimalised string.
   */
  get balanceAsDecimal() {
    const amount = this.balance / Math.pow(10, this.contract.decimals)
    return amount.toFixed(this.contract.decimals)
  }

  /**
   * Sends the specified amount of tokens to the given recipient.
   * 
   * All jigs are combined before sending so the JigBox will always be
   * consolidated to a single jig. Returns a txid.
   * 
   * An error will be throw if this is called on a JigBox with the type `NFT`.
   * 
   * @async
   * @param {string|Run.api.Lock} owner Recipient
   * @param {number} amount Tokens to send
   * @returns {Promise<string>}
   */
  async send(owner, amount) {
    ensureFungibleToken(this)

    const tx = new Run.Transaction()
    if (this.jigs.length > 1) {
      tx.update(() => this.jigs[0].combine(...this.jigs.slice(1)))
    }
    tx.update(() => this.jigs[0].send(owner, amount))
    const txid = await tx.publish()
    await this.sync()
    return txid
  }

  /**
   * As `send()` but allows the recipients to be given as an array so multiple
   * sends can be made in a single transaction.
   * 
   * @example ```
   * await box.sendMany([
   *   ['1FCKGH5tTjSkLgiQEKzoaKzDcBCD5dVHX6', 1000],
   *   ['1LANVRCyXPDco6UcoDmfXwNpc6Td55DBKK', 2000],
   *   ['18zLfZ2occiWTcrS2sjraL1ARveh8Qrad9', 500],
   * ])
   * ```
   * 
   * @async
   * @param {string|Run.api.Lock} owner Recipient
   * @param {number} amount Tokens to send
   * @returns {Promise<string>}
   */
  async sendMany(recipients) {
    ensureFungibleToken(this)
    if (!Array.isArray(recipients)) {
      throw new Error('Invalid recipients. `sendMany(recipients)` expects an array of recipients.')
    }

    const tx = new Run.Transaction()
    if (this.jigs.length > 1) {
      const jigs = this.jigs.slice(1)
      tx.update(() => this.jigs[0].combine(...jigs))
    }
    for (let args of recipients) {
      tx.update(() => this.jigs[0].send(...args))
    }
    const txid = await tx.publish()
    await this.sync()
    return txid
  }

  /**
   * Burns the specified amount of tokens.
   * 
   * All jigs are combined and split into two jigs. The jig containing the
   * specified amount of tokens is then destroyed. This occurs over two
   * transactions - the second (burning) txid is returned. 
   * 
   * An error will be throw if this is called on a JigBox with the type `NFT`.
   * 
   * @async
   * @param {number} amount Tokens to burn
   * @returns {Promise<string>}
   */
  async burn(amount) {
    ensureFungibleToken(this)

    // First tx is combine and split
    const tx1 = new Run.Transaction()
    if (this.jigs.length > 1) {
      const jigs = this.jigs.slice(1)
      tx1.update(() => this.jigs[0].combine(...jigs))
    }
    tx1.update(() => this.jigs[0].send(this.jigs[0].owner, amount))
    await tx1.publish()
    await this.sync()

    // Get the jig we want to destroy
    const jig = this.jigs.find(jig => jig.amount === amount)
    await jig.sync()

    // Second tx does ze burn
    const tx2 = new Run.Transaction()
    tx2.update(() => jig.destroy())
    const txid2 = await tx2.publish()
    await this.sync()
    
    return txid2
  }

  /**
   * Sync the JigBox with the Run network. Called automatically when a JigBox is
   * created and after each send.
   * 
   * @async
   */
  async sync() {
    await $.run.inventory.sync()
    this.jigs = $.run.inventory.jigs.filter(jig => jig instanceof this.contract)
  } 
}

// Throws if the box type is not FT
function ensureFungibleToken(box) {
  if (box.type !== 'FT') {
    throw new Error('Method unavailable. Type must be "FT".')
  }
}
