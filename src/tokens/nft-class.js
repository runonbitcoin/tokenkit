import Run from 'run-sdk'

/**
 * Temporarily define NFT here - should be in SDK eventually
 */
export class NFT extends Run.Jig {
  init(owner, number) {
    // Make sure we are calling from ourself
    const minting = caller === this.constructor
    const sending = caller && caller.constructor === this.constructor
    if (!minting && !sending) throw new Error('Must create token using mint()')

    this.sender = caller.owner
    if (owner) this.owner = owner
    if (number) {
      this.number = number
      this.no = number // relay compat
    }
  }

  static mint(owner) {
    const max = this.maxSupply || this.max // relay compat
    if (max && this.supply >= max) {
      throw new Error('Maximum supply exceeded')
    }

    this.supply++
    this.total++ // relay compat

    return new this(owner, this.supply)
  }

  send(to) {
    this.sender = this.owner
    this.owner = to
  }
}

NFT.sealed = false
NFT.supply = 0
NFT.total = 0
NFT.version = '1.0'
